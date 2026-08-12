import type { Database } from '@/types/database';

type Log = Database['public']['Tables']['logs']['Row'];

export interface FrequencyEntry {
  label: string;
  count: number;
}

export interface InsightsSummary {
  topSymptoms: FrequencyEntry[];
  moodFrequency: FrequencyEntry[];
  mostCommonMood: string | null;
  averagePainLevel: number | null;
  averageSleepHours: number | null;
  symptomsLoggedCount: number;
  moodsLoggedCount: number;
}

function tally<T extends string>(items: T[]): FrequencyEntry[] {
  const counts = new Map<string, number>();
  items.forEach((item) => counts.set(item, (counts.get(item) ?? 0) + 1));
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function average(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

/** Aggregates symptom/mood/pain/sleep patterns over any set of logs (e.g. last 30 or 90 days). */
export function computeInsightsSummary(logs: Log[]): InsightsSummary {
  const allSymptoms = logs.flatMap((l) => l.symptoms ?? []);
  const moods = logs.filter((l) => l.mood).map((l) => l.mood as string);
  const painLevels = logs.filter((l) => l.pain_level != null).map((l) => l.pain_level as number);
  const sleepHours = logs.filter((l) => l.sleep_hours != null).map((l) => l.sleep_hours as number);

  const moodFrequency = tally(moods);
  const topSymptoms = tally(allSymptoms).slice(0, 5);

  return {
    topSymptoms,
    moodFrequency,
    mostCommonMood: moodFrequency[0]?.label ?? null,
    averagePainLevel: average(painLevels),
    averageSleepHours: average(sleepHours),
    symptomsLoggedCount: logs.filter((l) => l.symptoms && l.symptoms.length > 0).length,
    moodsLoggedCount: moods.length,
  };
}

/** A few plain-language observations generated only from real data - never invented. */
export function generatePersonalInsights(summary: InsightsSummary, cycleIsRegular: boolean | null): string[] {
  const insights: string[] = [];

  if (summary.topSymptoms[0]) {
    insights.push(`Your most commonly logged symptom is ${summary.topSymptoms[0].label.toLowerCase()}.`);
  }
  if (summary.mostCommonMood) {
    insights.push(`You most often log feeling ${summary.mostCommonMood.toLowerCase()}.`);
  }
  if (summary.averageSleepHours !== null) {
    insights.push(`You've averaged ${summary.averageSleepHours.toFixed(1)} hours of sleep recently.`);
  }
  if (cycleIsRegular !== null) {
    insights.push(cycleIsRegular ? 'Your cycle has been regular.' : "Your cycle has been irregular - that's worth tracking closely.");
  }

  return insights;
}
