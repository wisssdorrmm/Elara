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
  { value: 'light', label: 'Light', drops: 1 },
  { value: 'medium', label: 'Medium', drops: 2 },
  { value: 'heavy', label: 'Heavy', drops: 3 },
  { value: 'very_heavy', label: 'Very heavy', drops: 4 },
];

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
