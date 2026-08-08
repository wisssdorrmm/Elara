export type CoupleFeeling = 'loved' | 'happy' | 'supported' | 'appreciated' | 'peaceful' | 'hurt' | 'ignored';
export type StreakType = 'daily_checkin' | 'appreciation' | 'date_night' | 'challenge' | 'quality_time';
export type AlertType = 'thinking_of_you' | 'sending_love' | 'here_for_you' | 'hope_you_are_well' | 'feeling_down' | 'call_me';

export interface CoupleStats {
  currentStreak: number;
  longestStreak: number;
  xp: number;
  level: string;
  levelProgress: number;
  dates: number;
  averageRating: number | null;
  checkins: number;
  appreciations: number;
}
