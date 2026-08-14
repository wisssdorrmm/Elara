import { addDays, differenceInCalendarDays, isWithinInterval, startOfDay } from 'date-fns';
import type { CyclePhase } from '@/types';
import type { Database } from '@/types/database';

type Period = Database['public']['Tables']['periods']['Row'];

export interface CycleStats {
  /** The most recent period on/before `today`, if any. */
  lastPeriod: Period | null;
  /** 1-indexed day of the current cycle (day 1 = period start). Null if no period logged yet. */
  cycleDay: number | null;
  phase: CyclePhase | null;
  /** Predicted start date of the next period (always in the future, rolled forward if overdue). Kept for backward compatibility - equals forecast.predictedDate (rolled forward) when a personalized forecast is available. */
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number | null;
  /** True if the raw (un-rolled) predicted period date has already passed. */
  isOverdue: boolean;
  /** How many days late the period is, if overdue (0 otherwise). */
  daysOverdue: number;
  ovulationDate: Date | null;
  fertileWindowStart: Date | null;
  fertileWindowEnd: Date | null;
  /** Personalized forecast built from the user's own cycle history. Never fabricated - see computeCycleForecast. */
  forecast: CycleForecast;
}

export type ForecastConfidence = 'high' | 'medium' | 'low' | 'insufficient';

export interface CycleForecast {
  /** Best single-date estimate. Null only when there isn't even a naive prediction to fall back to (no periods logged). */
  predictedDate: Date | null;
  /** Earliest plausible start date of the forecast window. Null when confidence is 'insufficient'. */
  earliestDate: Date | null;
  /** Latest plausible start date of the forecast window. Null when confidence is 'insufficient'. */
  latestDate: Date | null;
  confidence: ForecastConfidence;
  /** 0-1, only meaningful (non-null) once at least one completed cycle exists. Not a false-precision percentage - just a relative signal. */
  confidenceScore: number | null;
  /** Plain-language reason for the confidence level, shown directly in the UI. */
  explanation: string;
  /** The raw start-to-start cycle lengths (days) actually used, oldest first - exposed for testing/debugging, not required by callers. */
  cycleLengthsUsed: number[];
}

const LUTEAL_PHASE_LENGTH = 14;
/** Recency weighting: each cycle further back in time counts for less. 0.82 ~= most recent cycle counts ~3x a cycle from 6 cycles ago. */
const RECENCY_DECAY = 0.82;
/** A cycle length further than this many days from the median is treated as a likely outlier and down-weighted (not deleted). */
const OUTLIER_ABS_THRESHOLD_DAYS = 10;
const OUTLIER_WEIGHT_MULTIPLIER = 0.2;

/**
 * Finds the most recent period whose start date is on or before `today`.
 * Falls back to the latest period overall if all periods are in the future.
 */
function findLastPeriod(periods: Period[], today: Date): Period | null {
  if (periods.length === 0) return null;

  const past = periods
    .filter((p) => startOfDay(new Date(p.start_date)) <= today)
    .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());

  if (past.length > 0) return past[0];

  // No past periods logged (e.g. only a future/manual entry) - use the earliest one.
  return periods.slice().sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())[0];
}

/**
 * Cycle length = start of one period -> start of the next period. This is
 * deliberately never confused with period *duration* (how long the flow
 * lasts), which lives in `end_date - start_date` on the same row and is
 * unrelated to this calculation.
 * Returns lengths oldest-first, one entry per consecutive pair of periods.
 */
function computeCycleLengths(periods: Period[]): number[] {
  const sorted = periods
    .slice()
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());

  const lengths: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const len = differenceInCalendarDays(new Date(sorted[i].start_date), new Date(sorted[i - 1].start_date));
    // Guard against duplicate/bad data (e.g. two periods logged the same day) -
    // a 0 or negative "cycle" isn't real history and would poison the average.
    if (len > 0) lengths.push(len);
  }
  return lengths;
}

function median(nums: number[]): number {
  const sorted = nums.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Weighted mean/std-dev over the user's own cycle lengths. Two weighting
 * passes are combined per length: recency (newer cycles matter more) and
 * outlier down-weighting (a cycle far from the group median counts less,
 * but is never discarded - the raw history is untouched elsewhere).
 */
function weightedCycleStats(lengths: number[]): { mean: number; stdDev: number; effectiveSampleSize: number } {
  const med = median(lengths);
  const n = lengths.length;

  let weightedSum = 0;
  let totalWeight = 0;
  const weights: number[] = [];

  lengths.forEach((len, i) => {
    // i is oldest-first; more recent = higher index = higher weight.
    const ageFromNewest = n - 1 - i;
    const recencyWeight = Math.pow(RECENCY_DECAY, ageFromNewest);
    const isOutlier = Math.abs(len - med) > OUTLIER_ABS_THRESHOLD_DAYS;
    const outlierWeight = isOutlier ? OUTLIER_WEIGHT_MULTIPLIER : 1;
    const weight = recencyWeight * outlierWeight;

    weights.push(weight);
    weightedSum += len * weight;
    totalWeight += weight;
  });

  const mean = totalWeight > 0 ? weightedSum / totalWeight : med;

  let weightedVarianceSum = 0;
  lengths.forEach((len, i) => {
    weightedVarianceSum += weights[i] * Math.pow(len - mean, 2);
  });
  const variance = totalWeight > 0 ? weightedVarianceSum / totalWeight : 0;
  const stdDev = Math.sqrt(variance);

  // Effective sample size accounts for down-weighting - a history full of
  // outliers or very old cycles should not count as strongly as it would
  // by raw count alone.
  const effectiveSampleSize = totalWeight;

  return { mean, stdDev, effectiveSampleSize };
}

function classifyConfidence(
  cycleCount: number,
  stdDev: number
): { confidence: ForecastConfidence; confidenceScore: number } {
  let confidence: ForecastConfidence;
  if (cycleCount >= 4 && stdDev <= 1.5) {
    confidence = 'high';
  } else if (cycleCount >= 2 && stdDev <= 4.5) {
    confidence = 'medium';
  } else {
    confidence = 'low';
  }

  // Relative signal, not a claimed statistical percentage: rewards low
  // variability and more history, capped at 1.
  const variabilityScore = Math.max(0, 1 - stdDev / 14);
  const sampleScore = Math.min(cycleCount / 5, 1);
  const confidenceScore = Math.round((variabilityScore * 0.7 + sampleScore * 0.3) * 100) / 100;

  return { confidence, confidenceScore };
}

function forecastExplanation(confidence: ForecastConfidence, stdDev: number, cycleCount: number): string {
  if (confidence === 'insufficient') {
    return cycleCount === 0
      ? "Log your period to start building your personalized forecast."
      : "Log one more period so we can measure your first full cycle.";
  }
  if (confidence === 'high') return 'Your recent cycles have been relatively consistent.';
  if (confidence === 'medium') return 'Your recent cycles have varied slightly.';
  if (cycleCount <= 1) {
    return "This is a basic estimate based on limited history - it will get more accurate as you log more periods.";
  }
  return stdDev >= 10
    ? 'Your recent cycle lengths have varied significantly, so this estimate has a wide range.'
    : 'Your recent cycle lengths have varied, so this estimate has a wider range.';
}

/**
 * Builds a personalized forecast window from the user's own logged periods.
 * Deterministic and dependency-free - no AI involved, matching the product
 * requirement that the underlying math must be explainable and reproducible.
 *
 * Needs at least one *completed* cycle (two period start dates) to produce
 * any personalized estimate. With zero or one period logged there simply
 * isn't a real cycle length to measure yet, so we say so instead of
 * guessing - this is treated the same as "no usable history".
 */
export function computeCycleForecast(
  periods: Period[],
  fallbackAverageCycleLength: number,
  today: Date = new Date()
): CycleForecast {
  const normalizedToday = startOfDay(today);
  const lastPeriod = findLastPeriod(periods, normalizedToday);
  const cycleLengths = computeCycleLengths(periods);

  if (!lastPeriod) {
    return {
      predictedDate: null,
      earliestDate: null,
      latestDate: null,
      confidence: 'insufficient',
      confidenceScore: null,
      explanation: forecastExplanation('insufficient', 0, 0),
      cycleLengthsUsed: [],
    };
  }

  const lastStart = startOfDay(new Date(lastPeriod.start_date));

  if (cycleLengths.length === 0) {
    // Exactly one period ever logged: no completed cycle to measure yet.
    // Offer only a rough, clearly-low-confidence estimate off the profile's
    // starting average (set during onboarding) rather than inventing a
    // "personalized" number from nothing.
    const predictedDate = addDays(lastStart, fallbackAverageCycleLength);
    return {
      predictedDate,
      earliestDate: null,
      latestDate: null,
      confidence: 'insufficient',
      confidenceScore: null,
      explanation: forecastExplanation('insufficient', 0, 0),
      cycleLengthsUsed: [],
    };
  }

  const { mean, stdDev, effectiveSampleSize } = weightedCycleStats(cycleLengths);
  const { confidence, confidenceScore } = classifyConfidence(cycleLengths.length, stdDev);

  const predictedDate = addDays(lastStart, Math.round(mean));

  // Window half-width scales with actual variability - never the same for
  // every user. Floored at 1 day (a window can't be a single instant) and
  // capped at 10 so a wildly irregular history still gives a usable range.
  const halfWidth = Math.min(Math.max(Math.round(stdDev), 1), 10);
  const earliestDate = addDays(predictedDate, -halfWidth);
  const latestDate = addDays(predictedDate, halfWidth);

  return {
    predictedDate,
    earliestDate,
    latestDate,
    confidence,
    confidenceScore,
    explanation: forecastExplanation(confidence, stdDev, Math.round(effectiveSampleSize)),
    cycleLengthsUsed: cycleLengths,
  };
}

/**
 * Computes all dashboard/calendar cycle stats from raw period rows + the user's
 * average cycle/period length. Pure function - no I/O - so it's easy to test
 * and reuse between Dashboard and Calendar.
 */
export function computeCycleStats(
  periods: Period[],
  averageCycleLength: number,
  averagePeriodLength: number,
  today: Date = new Date()
): CycleStats {
  const normalizedToday = startOfDay(today);
  const lastPeriod = findLastPeriod(periods, normalizedToday);
  const forecast = computeCycleForecast(periods, averageCycleLength, today);

  if (!lastPeriod) {
    return {
      lastPeriod: null,
      cycleDay: null,
      phase: null,
      nextPeriodDate: null,
      daysUntilNextPeriod: null,
      isOverdue: false,
      daysOverdue: 0,
      ovulationDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
      forecast,
    };
  }

  const lastStart = startOfDay(new Date(lastPeriod.start_date));

  // Cycle day: days since last period start, wrapped into [1, averageCycleLength].
  const daysSinceStart = differenceInCalendarDays(normalizedToday, lastStart);
  const cycleDay = ((daysSinceStart % averageCycleLength) + averageCycleLength) % averageCycleLength + 1;

  // The personalized single-cycle prediction (falls back to the profile
  // average when there isn't enough history yet - see computeCycleForecast),
  // BEFORE rolling forward - used to detect "late".
  const rawNextPeriodDate = forecast.predictedDate ?? addDays(lastStart, averageCycleLength);
  const isOverdue = normalizedToday > rawNextPeriodDate;
  const daysOverdue = isOverdue ? differenceInCalendarDays(normalizedToday, rawNextPeriodDate) : 0;

  // Roll the predicted next period (and its window) forward by whole cycles
  // until it's actually in the future, in case the user hasn't logged a
  // period in a while. Used for the "Next period in N days" display, which
  // should always show a future date even when the period is late.
  let nextPeriodDate = rawNextPeriodDate;
  let rolledForecastEarliest = forecast.earliestDate;
  let rolledForecastLatest = forecast.latestDate;
  while (nextPeriodDate <= normalizedToday) {
    nextPeriodDate = addDays(nextPeriodDate, averageCycleLength);
    if (rolledForecastEarliest) rolledForecastEarliest = addDays(rolledForecastEarliest, averageCycleLength);
    if (rolledForecastLatest) rolledForecastLatest = addDays(rolledForecastLatest, averageCycleLength);
  }
  const daysUntilNextPeriod = differenceInCalendarDays(nextPeriodDate, normalizedToday);

  // Ovulation ~14 days before the next period; fertile window is the 5 days
  // leading up to and including ovulation day. Estimated from the predicted
  // date only, never presented as confirmed - see phaseInfo/UI copy.
  const ovulationDate = addDays(nextPeriodDate, -LUTEAL_PHASE_LENGTH);
  const fertileWindowStart = addDays(ovulationDate, -4);
  const fertileWindowEnd = ovulationDate;

  const phase = getPhaseForCycleDay(cycleDay, averageCycleLength, averagePeriodLength);

  return {
    lastPeriod,
    cycleDay,
    phase,
    nextPeriodDate,
    daysUntilNextPeriod,
    isOverdue,
    daysOverdue,
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
    forecast: { ...forecast, earliestDate: rolledForecastEarliest, latestDate: rolledForecastLatest },
  };
}

export function getPhaseForCycleDay(cycleDay: number, cycleLength: number, periodLength: number): CyclePhase {
  const ovulationDay = cycleLength - LUTEAL_PHASE_LENGTH;

  if (cycleDay <= periodLength) return 'menstrual';
  if (cycleDay < ovulationDay - 1) return 'follicular';
  if (cycleDay <= ovulationDay + 1) return 'ovulation';
  return 'luteal';
}

export const phaseInfo: Record<CyclePhase, { label: string; description: string; color: string }> = {
  menstrual: {
    label: 'Menstrual phase',
    description: 'Your period is here. Rest and gentle movement can help with cramps and fatigue.',
    color: '#EF4444',
  },
  follicular: {
    label: 'Follicular phase',
    description: 'Energy tends to rise as your body prepares an egg for release.',
    color: '#A855F7',
  },
  ovulation: {
    label: 'Ovulation phase',
    description: "You're likely at your most fertile. Some notice a boost in energy and mood.",
    color: '#7C3AED',
  },
  luteal: {
    label: 'Luteal phase',
    description: 'Progesterone rises. Some experience PMS symptoms in the days before their period.',
    color: '#C084FC',
  },
};

export type DayState = 'period' | 'predicted' | 'ovulation' | 'fertile' | 'none';

/**
 * Determines what a single calendar day should be highlighted as, given the
 * full list of logged periods and the computed cycle stats for "today".
 * `averagePeriodLength` controls how many days the predicted period spans -
 * this must come from the user's profile, not a hardcoded value.
 */
export function getDayState(date: Date, periods: Period[], stats: CycleStats, averagePeriodLength: number): DayState {
  const day = startOfDay(date);

  const inActualPeriod = periods.some((p) => {
    const start = startOfDay(new Date(p.start_date));
    const end = p.end_date ? startOfDay(new Date(p.end_date)) : start;
    return isWithinInterval(day, { start, end });
  });
  if (inActualPeriod) return 'period';

  if (stats.nextPeriodDate) {
    const predictedEnd = addDays(stats.nextPeriodDate, Math.max(averagePeriodLength - 1, 0));
    if (isWithinInterval(day, { start: stats.nextPeriodDate, end: predictedEnd })) return 'predicted';
  }

  if (stats.ovulationDate && day.getTime() === startOfDay(stats.ovulationDate).getTime()) return 'ovulation';

  if (
    stats.fertileWindowStart &&
    stats.fertileWindowEnd &&
    isWithinInterval(day, { start: stats.fertileWindowStart, end: stats.fertileWindowEnd })
  ) {
    return 'fertile';
  }

  return 'none';
}
