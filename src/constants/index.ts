import type { FlowIntensity } from '@/types';

/** Days-before-period options shown when picking reminder preferences. 0 = "on the day". */
export const REMINDER_DAY_OPTIONS = [10, 7, 5, 3, 1, 0] as const;

export function formatReminderDayLabel(day: number): string {
  if (day === 0) return 'On the day';
  return `${day} day${day > 1 ? 's' : ''} before`;
}

export interface FlowOption {
  value: FlowIntensity;
  label: string;
  drops: number;
}

export const FLOW_OPTIONS: FlowOption[] = [
  { value: 'spotting', label: 'Spotting', drops: 0 },
  { value: 'light', label: 'Light', drops: 1 },
  { value: 'medium', label: 'Medium', drops: 2 },
  { value: 'heavy', label: 'Heavy', drops: 3 },
  { value: 'very_heavy', label: 'Very heavy', drops: 4 },
];

/** Numeric scale for flow intensity, used to compute averages/trends in the period report. */
export const FLOW_SCALE: Record<FlowIntensity, number> = {
  spotting: 0,
  light: 1,
  medium: 2,
  heavy: 3,
  very_heavy: 4,
};

export const FLOW_LABELS: Record<FlowIntensity, string> = {
  spotting: 'Spotting',
  light: 'Light',
  medium: 'Medium',
  heavy: 'Heavy',
  very_heavy: 'Very heavy',
};

export const SYMPTOM_OPTIONS = [
  'Cramps',
  'Headache',
  'Back pain',
  'Bloating',
  'Fatigue',
  'Acne',
  'Tender breasts',
  'Nausea',
  'Constipation',
  'Diarrhea',
  'Food cravings',
] as const;

export const MOOD_OPTIONS = [
  { label: 'Happy', emoji: '😊' },
  { label: 'Calm', emoji: '😌' },
  { label: 'Neutral', emoji: '😐' },
  { label: 'Sad', emoji: '😢' },
  { label: 'Anxious', emoji: '😰' },
  { label: 'Irritable', emoji: '😠' },
  { label: 'Energetic', emoji: '⚡' },
  { label: 'Romantic', emoji: '💗' },
] as const;

/** Rough positive/negative weight per mood, used only for the "mood trend" insight in the period report. */
export const MOOD_VALENCE: Record<string, number> = {
  Happy: 2,
  Energetic: 1,
  Calm: 1,
  Romantic: 1,
  Neutral: 0,
  Anxious: -1,
  Irritable: -1,
  Sad: -2,
};

/** 0-10 pain scale labels shown on the Pain log screen. */
export const PAIN_SCALE = Array.from({ length: 11 }, (_, i) => i);

export function formatPainLabel(level: number): string {
  if (level === 0) return 'No pain';
  if (level <= 3) return 'Mild';
  if (level <= 6) return 'Moderate';
  return 'Severe';
}
