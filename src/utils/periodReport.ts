import { differenceInCalendarDays, format } from 'date-fns';
import { FLOW_SCALE, FLOW_LABELS, MOOD_VALENCE } from '@/constants';
import type { Database, FlowIntensity } from '@/types';

type Period = Database['public']['Tables']['periods']['Row'];
type Log = Database['public']['Tables']['logs']['Row'];

export interface FlowDay {
  date: string;
  dayNumber: number;
  flow: FlowIntensity | null;
}

export interface CycleSummary {
  startDate: string;
  endDate: string;
  durationDays: number;
  cycleLengthDays: number | null;
  averageFlow: FlowIntensity | null;
  heaviestDay: number | null;
  lightestDay: number | null;
}

export type Trend = 'up' | 'down' | 'steady';

export interface MoodSummary {
  mostCommon: string | null;
  frequency: { mood: string; days: number }[];
  trend: Trend | null;
}

export interface SymptomsSummary {
  mostCommon: string | null;
  totalLogged: number;
  topSymptoms: { symptom: string; count: number }[];
}

export interface PainSummary {
  average: number | null;
  highest: number | null;
  trend: Trend | null;
}

export interface SleepSummary {
  average: number | null;
  best: number | null;
  worst: number | null;
  trend: Trend | null;
}

export interface NotesSummary {
  latestNote: string | null;
  latestNoteDate: string | null;
}

export interface CycleComparison {
  previousDurationDays: number;
  currentDurationDays: number;
  durationDifferenceDays: number;
  flowComparisonLabel: string;
  painComparisonLabel: string;
  sleepComparisonLabel: string;
}

export interface PeriodReport {
  cycleSummary: CycleSummary;
  flowTimeline: FlowDay[];
  moodSummary: MoodSummary;
  symptomsSummary: SymptomsSummary;
  painSummary: PainSummary;
  sleepSummary: SleepSummary;
  notesSummary: NotesSummary;
  insights: string[];
  comparison: CycleComparison | null;
}

const FLOW_ORDER: FlowIntensity[] = ['spotting', 'light', 'medium', 'heavy', 'very_heavy'];

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function firstHalf<T>(arr: T[]): T[] {
  return arr.slice(0, Math.ceil(arr.length / 2));
}

function secondHalf<T>(arr: T[]): T[] {
  return arr.slice(Math.ceil(arr.length / 2));
}

/** Compares average of the second half against the first half, with a tolerance to avoid noisy trends. */
function trendFromHalves(values: number[], tolerance: number): Trend | null {
  if (values.length < 2) return null;
  const firstAvg = average(firstHalf(values));
  const secondAvg = average(secondHalf(values));
  if (firstAvg === null || secondAvg === null) return null;
  const diff = secondAvg - firstAvg;
  if (Math.abs(diff) < tolerance) return 'steady';
  return diff > 0 ? 'up' : 'down';
}

function buildFlowTimeline(period: Period, logs: Log[]): FlowDay[] {
  const start = new Date(period.start_date);
  const end = period.end_date ? new Date(period.end_date) : start;
  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const logsByDate = new Map(logs.map((l) => [l.log_date, l]));

  const days: FlowDay[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = format(date, 'yyyy-MM-dd');
    days.push({ date: dateStr, dayNumber: i + 1, flow: logsByDate.get(dateStr)?.flow ?? null });
  }
  return days;
}

function buildCycleSummary(period: Period, flowTimeline: FlowDay[], previousPeriod: Period | null): CycleSummary {
  const start = period.start_date;
  const end = period.end_date ?? period.start_date;
  const durationDays = differenceInCalendarDays(new Date(end), new Date(start)) + 1;

  const cycleLengthDays = previousPeriod
    ? differenceInCalendarDays(new Date(period.start_date), new Date(previousPeriod.start_date))
    : null;

  const loggedFlowDays = flowTimeline.filter((d): d is FlowDay & { flow: FlowIntensity } => d.flow !== null);
  const scores = loggedFlowDays.map((d) => FLOW_SCALE[d.flow]);
  const avgScore = average(scores);
  const averageFlow = avgScore !== null ? FLOW_ORDER[Math.round(avgScore)] : null;

  let heaviestDay: number | null = null;
  let lightestDay: number | null = null;
  if (loggedFlowDays.length > 0) {
    heaviestDay = loggedFlowDays.reduce((max, d) => (FLOW_SCALE[d.flow] > FLOW_SCALE[max.flow] ? d : max)).dayNumber;
    lightestDay = loggedFlowDays.reduce((min, d) => (FLOW_SCALE[d.flow] < FLOW_SCALE[min.flow] ? d : min)).dayNumber;
  }

  return { startDate: start, endDate: end, durationDays, cycleLengthDays, averageFlow, heaviestDay, lightestDay };
}

function buildMoodSummary(logs: Log[]): MoodSummary {
  const moodLogs = logs.filter((l) => l.mood);
  if (moodLogs.length === 0) {
    return { mostCommon: null, frequency: [], trend: null };
  }

  const counts = new Map<string, number>();
  moodLogs.forEach((l) => counts.set(l.mood as string, (counts.get(l.mood as string) ?? 0) + 1));
  const frequency = Array.from(counts.entries())
    .map(([mood, days]) => ({ mood, days }))
    .sort((a, b) => b.days - a.days);

  const valences = moodLogs.map((l) => MOOD_VALENCE[l.mood as string] ?? 0);
  const trend = trendFromHalves(valences, 0.5);

  return { mostCommon: frequency[0]?.mood ?? null, frequency, trend };
}

function buildSymptomsSummary(logs: Log[]): SymptomsSummary {
  const allSymptoms = logs.flatMap((l) => l.symptoms ?? []);
  if (allSymptoms.length === 0) {
    return { mostCommon: null, totalLogged: 0, topSymptoms: [] };
  }

  const counts = new Map<string, number>();
  allSymptoms.forEach((s) => counts.set(s, (counts.get(s) ?? 0) + 1));
  const topSymptoms = Array.from(counts.entries())
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count);

  return { mostCommon: topSymptoms[0]?.symptom ?? null, totalLogged: allSymptoms.length, topSymptoms };
}

function buildPainSummary(logs: Log[]): PainSummary {
  const painValues = logs.filter((l) => l.pain_level != null).map((l) => l.pain_level as number);
  if (painValues.length === 0) return { average: null, highest: null, trend: null };

  return {
    average: average(painValues),
    highest: Math.max(...painValues),
    trend: trendFromHalves(painValues, 0.5),
  };
}

function buildSleepSummary(logs: Log[]): SleepSummary {
  const sleepValues = logs.filter((l) => l.sleep_hours != null).map((l) => l.sleep_hours as number);
  if (sleepValues.length === 0) return { average: null, best: null, worst: null, trend: null };

  return {
    average: average(sleepValues),
    best: Math.max(...sleepValues),
    worst: Math.min(...sleepValues),
    trend: trendFromHalves(sleepValues, 0.5),
  };
}

function buildNotesSummary(logs: Log[]): NotesSummary {
  const withNotes = logs.filter((l) => l.notes).sort((a, b) => (a.log_date < b.log_date ? 1 : -1));
  if (withNotes.length === 0) return { latestNote: null, latestNoteDate: null };
  return { latestNote: withNotes[0].notes, latestNoteDate: withNotes[0].log_date };
}

function buildComparison(
  cycleSummary: CycleSummary,
  painSummary: PainSummary,
  sleepSummary: SleepSummary,
  previousPeriod: Period | null,
  previousLogs: Log[]
): CycleComparison | null {
  if (!previousPeriod) return null;

  const prevDuration =
    differenceInCalendarDays(
      new Date(previousPeriod.end_date ?? previousPeriod.start_date),
      new Date(previousPeriod.start_date)
    ) + 1;

  const prevFlowValues = previousLogs.filter((l) => l.flow).map((l) => FLOW_SCALE[l.flow as FlowIntensity]);
  const prevAvgFlow = average(prevFlowValues);
  const currentAvgFlow =
    cycleSummary.averageFlow !== null ? FLOW_SCALE[cycleSummary.averageFlow] : null;

  const flowComparisonLabel = describeDifference(currentAvgFlow, prevAvgFlow, 'flow');

  const prevPainValues = previousLogs.filter((l) => l.pain_level != null).map((l) => l.pain_level as number);
  const prevAvgPain = average(prevPainValues);
  const painComparisonLabel = describeDifference(painSummary.average, prevAvgPain, 'pain');

  const prevSleepValues = previousLogs.filter((l) => l.sleep_hours != null).map((l) => l.sleep_hours as number);
  const prevAvgSleep = average(prevSleepValues);
  const sleepComparisonLabel = describeDifference(sleepSummary.average, prevAvgSleep, 'sleep');

  return {
    previousDurationDays: prevDuration,
    currentDurationDays: cycleSummary.durationDays,
    durationDifferenceDays: cycleSummary.durationDays - prevDuration,
    flowComparisonLabel,
    painComparisonLabel,
    sleepComparisonLabel,
  };
}

function describeDifference(current: number | null, previous: number | null, kind: 'flow' | 'pain' | 'sleep'): string {
  if (current === null || previous === null) return 'Not enough data';
  const diff = current - previous;
  const magnitude = Math.abs(diff);

  // For sleep, "up" is good (better); for flow/pain, "down" is generally the gentler read.
  const higherIsBetter = kind === 'sleep';
  const better = higherIsBetter ? diff > 0 : diff < 0;

  if (magnitude < 0.4) return 'About the same';
  const word = magnitude < 1 ? 'Slightly' : 'Notably';
  return `${word} ${better ? betterWord(kind) : worseWord(kind)}`;
}

function betterWord(kind: 'flow' | 'pain' | 'sleep') {
  if (kind === 'flow') return 'lighter';
  if (kind === 'pain') return 'lower';
  return 'better';
}

function worseWord(kind: 'flow' | 'pain' | 'sleep') {
  if (kind === 'flow') return 'heavier';
  if (kind === 'pain') return 'higher';
  return 'worse';
}

function buildInsights(
  cycleSummary: CycleSummary,
  flowTimeline: FlowDay[],
  moodSummary: MoodSummary,
  sleepSummary: SleepSummary,
  averageCycleLength: number
): string[] {
  const insights: string[] = [];
  const loggedFlow = flowTimeline.filter((d): d is FlowDay & { flow: FlowIntensity } => d.flow !== null);
  const midpointDay = Math.ceil(loggedFlow.length / 2);

  if (loggedFlow.length >= 2) {
    const scores = loggedFlow.map((d) => FLOW_SCALE[d.flow]);
    const flowTrend = trendFromHalves(scores, 0.4);
    if (flowTrend === 'down') insights.push(`Your flow became lighter after Day ${midpointDay}.`);
    if (flowTrend === 'up') insights.push(`Your flow became heavier after Day ${midpointDay}.`);
  }

  if (moodSummary.trend === 'up') insights.push('Your mood improved throughout the week.');
  if (moodSummary.trend === 'down') insights.push('Your mood dipped as the week went on.');

  if (sleepSummary.trend === 'up') insights.push('You slept better during the second half of your period.');
  if (sleepSummary.trend === 'down') insights.push('Your sleep got worse during the second half of your period.');

  if (cycleSummary.cycleLengthDays !== null) {
    const diff = Math.abs(cycleSummary.cycleLengthDays - averageCycleLength);
    if (diff <= 3) {
      insights.push('Your cycle length is within your normal range.');
    } else if (cycleSummary.cycleLengthDays > averageCycleLength) {
      insights.push('This cycle was longer than your usual pattern.');
    } else {
      insights.push('This cycle was shorter than your usual pattern.');
    }
  }

  return insights;
}

/** Generates a "you experienced X mostly during the first/second half" insight for the top symptom. */
function symptomTimingInsight(period: Period, logs: Log[], topSymptom: string | null): string | null {
  if (!topSymptom) return null;

  const start = new Date(period.start_date);
  const end = period.end_date ? new Date(period.end_date) : start;
  const totalDays = Math.max(differenceInCalendarDays(end, start) + 1, 1);
  const midpoint = Math.ceil(totalDays / 2);

  let firstHalfCount = 0;
  let secondHalfCount = 0;
  logs.forEach((l) => {
    if (!l.symptoms?.includes(topSymptom)) return;
    const dayIndex = differenceInCalendarDays(new Date(l.log_date), start) + 1;
    if (dayIndex <= midpoint) firstHalfCount++;
    else secondHalfCount++;
  });

  const total = firstHalfCount + secondHalfCount;
  if (total < 2) return null;
  if (firstHalfCount > secondHalfCount) {
    return `You experienced ${topSymptom.toLowerCase()} mostly during the first half of your cycle.`;
  }
  if (secondHalfCount > firstHalfCount) {
    return `You experienced ${topSymptom.toLowerCase()} mostly during the second half of your cycle.`;
  }
  return null;
}

/**
 * Generates the full end-of-period report. Pure function - all data must be
 * fetched by the caller (PeriodReport.tsx) and passed in. Never throws; any
 * missing data just results in null/empty fields so the UI can render
 * graceful empty states instead of crashing.
 */
export function generatePeriodReport(
  period: Period,
  logs: Log[],
  previousPeriod: Period | null,
  previousLogs: Log[],
  averageCycleLength: number
): PeriodReport {
  const sortedLogs = logs.slice().sort((a, b) => (a.log_date < b.log_date ? -1 : 1));

  const flowTimeline = buildFlowTimeline(period, sortedLogs);
  const cycleSummary = buildCycleSummary(period, flowTimeline, previousPeriod);
  const moodSummary = buildMoodSummary(sortedLogs);
  const symptomsSummary = buildSymptomsSummary(sortedLogs);
  const painSummary = buildPainSummary(sortedLogs);
  const sleepSummary = buildSleepSummary(sortedLogs);
  const notesSummary = buildNotesSummary(sortedLogs);
  const comparison = buildComparison(cycleSummary, painSummary, sleepSummary, previousPeriod, previousLogs);

  const insights = buildInsights(cycleSummary, flowTimeline, moodSummary, sleepSummary, averageCycleLength);
  const symptomInsight = symptomTimingInsight(period, sortedLogs, symptomsSummary.mostCommon);
  if (symptomInsight) insights.splice(1, 0, symptomInsight);

  return {
    cycleSummary,
    flowTimeline,
    moodSummary,
    symptomsSummary,
    painSummary,
    sleepSummary,
    notesSummary,
    insights,
    comparison,
  };
}

export { FLOW_LABELS };
