import type { FlowIntensity, CheckinFeeling, PartnerAlertType } from '@/types';

/** Days-before-period options shown when picking reminder preferences. 0 = "on the day". */
export const REMINDER_DAY_OPTIONS = [10, 7, 5, 3, 1, 0] as const;

export function formatReminderDayLabel(day: number): string {
  if (day === 0) return 'On the day';
  return `${day} day${day > 1 ? 's' : ''} before`;
}

// ============================================================================
// Part 7 — Couple platform constants. Definitions live here (frontend), not
// in the database, matching the SQL migration's design (badge_key/
// challenge_key/alert_type are just text keys in the DB; labels/emoji are
// resolved client-side, same pattern as FLOW_OPTIONS/MOOD_OPTIONS above).
// ============================================================================

export const CHECKIN_FEELING_OPTIONS: { value: CheckinFeeling; label: string; emoji: string }[] = [
  { value: 'loved', label: 'Loved', emoji: '❤️' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
  { value: 'supported', label: 'Supported', emoji: '🤗' },
  { value: 'appreciated', label: 'Appreciated', emoji: '🙏' },
  { value: 'peaceful', label: 'Peaceful', emoji: '😌' },
  { value: 'hurt', label: 'Hurt', emoji: '😔' },
  { value: 'ignored', label: 'Ignored', emoji: '😴' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
];

export const CHECKIN_FEELING_LABELS: Record<CheckinFeeling, string> = {
  loved: 'Loved',
  happy: 'Happy',
  supported: 'Supported',
  appreciated: 'Appreciated',
  peaceful: 'Peaceful',
  hurt: 'Hurt',
  ignored: 'Ignored',
  sad: 'Sad',
};

export const APPRECIATION_PRESETS = [
  'Thank you for being there.',
  'I appreciate you.',
  'You made my day better.',
  "I'm grateful for you.",
  'You mean so much to me.',
];

export const PARTNER_ALERT_OPTIONS: { value: PartnerAlertType; label: string }[] = [
  { value: 'thinking_of_you', label: '❤️ Thinking of you' },
  { value: 'sending_love', label: '💕 Sending you love' },
  { value: 'im_here_for_you', label: "🫶 I'm here for you" },
  { value: 'hope_good_day', label: '😊 Hope you\'re having a good day' },
  { value: 'feeling_down', label: "🥺 I'm feeling down" },
  { value: 'call_me', label: '📞 Call me' },
];

export type QuestionCategory = 'LOVE' | 'FUN' | 'KNOW_ME' | 'MEMORIES' | 'FUTURE' | 'DEEP' | 'DATE_NIGHT';

export const QUESTION_CATEGORY_LABELS: Record<QuestionCategory, { label: string; emoji: string }> = {
  LOVE: { label: 'Love', emoji: '❤️' },
  FUN: { label: 'Fun', emoji: '😄' },
  KNOW_ME: { label: 'Know Me', emoji: '💡' },
  MEMORIES: { label: 'Memories', emoji: '📸' },
  FUTURE: { label: 'Future', emoji: '🔮' },
  DEEP: { label: 'Deep', emoji: '🌊' },
  DATE_NIGHT: { label: 'Date Night', emoji: '🌙' },
};

export const BADGE_DEFINITIONS: Record<string, { label: string; emoji: string; description: string }> = {
  first_checkin: { label: 'First Check-in', emoji: '❤️', description: 'Completed your first daily check-in' },
  streak_7: { label: '7 Day Streak', emoji: '🔥', description: 'Checked in for 7 days in a row' },
  streak_30: { label: '30 Day Streak', emoji: '🔥', description: 'Checked in for 30 days in a row' },
  appreciation_master: { label: 'Appreciation Master', emoji: '💌', description: 'Sent 10 appreciations' },
  challenge_champion: { label: 'Challenge Champion', emoji: '🏆', description: 'Completed a weekly challenge' },
};

export const WEEKLY_CHALLENGE_DEFINITIONS: Record<string, { title: string; description: string }> = {
  meaningful_conversation: { title: 'Have a meaningful conversation', description: 'Talk about something that matters to you both.' },
  give_appreciation: { title: 'Give each other appreciation', description: 'Send your partner an appreciation message.' },
  plan_a_date: { title: 'Plan a date', description: 'Plan and log a date together.' },
  daily_checkins: { title: 'Complete daily check-ins', description: "Check in with how you're feeling for a few days this week." },
  thoughtful_gesture: { title: 'Do something thoughtful', description: 'Surprise your partner with a small, thoughtful gesture.' },
};

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
