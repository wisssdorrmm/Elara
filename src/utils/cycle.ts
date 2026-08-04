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
  /** Predicted start date of the next period (always in the future, rolled forward if overdue). */
  nextPeriodDate: Date | null;
  daysUntilNextPeriod: number | null;
  /** True if the next predicted period is today or earlier (i.e. it's late). */
  isOverdue: boolean;
  ovulationDate: Date | null;
  fertileWindowStart: Date | null;
  fertileWindowEnd: Date | null;
}

const LUTEAL_PHASE_LENGTH = 14;

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

  if (!lastPeriod) {
    return {
      lastPeriod: null,
      cycleDay: null,
      phase: null,
      nextPeriodDate: null,
      daysUntilNextPeriod: null,
      isOverdue: false,
      ovulationDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
    };
  }

  const lastStart = startOfDay(new Date(lastPeriod.start_date));

  // Cycle day: days since last period start, wrapped into [1, averageCycleLength].
  const daysSinceStart = differenceInCalendarDays(normalizedToday, lastStart);
  const cycleDay = ((daysSinceStart % averageCycleLength) + averageCycleLength) % averageCycleLength + 1;

  // Roll the predicted next period forward until it's actually in the future,
  // in case the user hasn't logged a period in a while.
  let nextPeriodDate = addDays(lastStart, averageCycleLength);
  while (nextPeriodDate <= normalizedToday) {
    nextPeriodDate = addDays(nextPeriodDate, averageCycleLength);
  }
  const daysUntilNextPeriod = differenceInCalendarDays(nextPeriodDate, normalizedToday);
  const isOverdue = daysUntilNextPeriod === 0 && differenceInCalendarDays(normalizedToday, lastStart) >= averageCycleLength;

  // Ovulation ~14 days before the next period; fertile window is the 5 days
  // leading up to and including ovulation day.
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
    ovulationDate,
    fertileWindowStart,
    fertileWindowEnd,
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
 */
export function getDayState(date: Date, periods: Period[], stats: CycleStats): DayState {
  const day = startOfDay(date);

  const inActualPeriod = periods.some((p) => {
    const start = startOfDay(new Date(p.start_date));
    const end = p.end_date ? startOfDay(new Date(p.end_date)) : start;
    return isWithinInterval(day, { start, end });
  });
  if (inActualPeriod) return 'period';

  if (stats.nextPeriodDate) {
    // Approximate predicted period length using the same average used elsewhere;
    // callers pass averagePeriodLength via stats consumers when needed.
    const predictedEnd = addDays(stats.nextPeriodDate, 4);
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
