export type CycleGoal =
  | 'track_periods'
  | 'get_pregnant'
  | 'avoid_pregnancy'
  | 'understand_body'
  | 'manage_irregular_cycles';

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

export type RelationshipStatus = 'active' | 'ended';

export type StreakType = 'daily_checkin' | 'appreciation' | 'date_night' | 'weekly_challenge';
export type CheckinFeeling = 'loved' | 'happy' | 'supported' | 'appreciated' | 'peaceful' | 'hurt' | 'ignored' | 'sad';
export type TimelineEventType =
  | 'started_dating'
  | 'first_date'
  | 'trip'
  | 'birthday'
  | 'anniversary'
  | 'milestone'
  | 'memory'
  | 'challenge_completed'
  | 'other';
export type XpSourceType = 'checkin' | 'appreciation' | 'date_logged' | 'challenge_completed' | 'streak_milestone' | 'couple_question';
export type PartnerAlertType = 'thinking_of_you' | 'sending_love' | 'im_here_for_you' | 'hope_good_day' | 'feeling_down' | 'call_me';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string | null;
          date_of_birth: string | null;
          country: string | null;
          goal: CycleGoal | null;
          average_cycle_length: number;
          average_period_length: number;
          cycle_is_regular: boolean | null;
          reminder_days_before: number[];
          reminder_time: string;
          notifications_enabled: boolean;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['profiles']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
        Relationships: [];
      };
      periods: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['periods']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          user_id: string;
          start_date: string;
        };
        Update: Partial<Database['public']['Tables']['periods']['Row']>;
        Relationships: [];
      };
      logs: {
        Row: {
          id: string;
          user_id: string;
          log_date: string;
          flow: FlowIntensity | null;
          symptoms: string[];
          mood: string | null;
          pain_level: number | null;
          sleep_hours: number | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['logs']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          user_id: string;
          log_date: string;
        };
        Update: Partial<Database['public']['Tables']['logs']['Row']>;
        Relationships: [];
      };
      /** Matches the LIVE table exactly - state is (revoked, accepted_at, accepted_by), not a status enum. */
      couple_invites: {
        Row: {
          id: string;
          inviter_id: string;
          invite_code: string;
          revoked: boolean;
          created_at: string;
          expires_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
          relationship_id: string | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_invites']['Row'], 'id' | 'created_at'>> & {
          inviter_id: string;
          invite_code: string;
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['couple_invites']['Row']>;
        Relationships: [];
      };
      /** Matches the LIVE table exactly - user_one_id/user_two_id, no nickname/ended_at columns. */
      relationships: {
        Row: {
          id: string;
          user_one_id: string;
          user_two_id: string;
          status: RelationshipStatus;
          relationship_start_date: string;
          anniversary: string | null;
          partner_birthday: string | null;
          first_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['relationships']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          user_one_id: string;
          user_two_id: string;
          relationship_start_date: string;
        };
        Update: Partial<Database['public']['Tables']['relationships']['Row']>;
        Relationships: [];
      };

      couple_streaks: {
        Row: {
          id: string;
          relationship_id: string;
          streak_type: StreakType;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_streaks']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          relationship_id: string;
          streak_type: StreakType;
        };
        Update: Partial<Database['public']['Tables']['couple_streaks']['Row']>;
        Relationships: [];
      };
      daily_checkins: {
        Row: {
          id: string;
          relationship_id: string;
          user_id: string;
          checkin_date: string;
          feeling: CheckinFeeling;
          note: string | null;
          is_shared: boolean;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['daily_checkins']['Row'], 'id' | 'created_at'>> & {
          relationship_id: string;
          user_id: string;
          feeling: CheckinFeeling;
        };
        Update: Partial<Database['public']['Tables']['daily_checkins']['Row']>;
        Relationships: [];
      };
      appreciations: {
        Row: {
          id: string;
          relationship_id: string;
          sender_id: string;
          recipient_id: string;
          message: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['appreciations']['Row'], 'id' | 'created_at'>> & {
          relationship_id: string;
          sender_id: string;
          recipient_id: string;
          message: string;
        };
        Update: Partial<Database['public']['Tables']['appreciations']['Row']>;
        Relationships: [];
      };
      couple_dates: {
        Row: {
          id: string;
          relationship_id: string;
          created_by: string;
          title: string;
          date_on: string;
          location: string | null;
          rating: number | null;
          notes: string | null;
          photo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_dates']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          relationship_id: string;
          created_by: string;
          title: string;
          date_on: string;
        };
        Update: Partial<Database['public']['Tables']['couple_dates']['Row']>;
        Relationships: [];
      };
      relationship_timeline: {
        Row: {
          id: string;
          relationship_id: string;
          created_by: string | null;
          event_type: TimelineEventType;
          title: string;
          description: string | null;
          event_date: string;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['relationship_timeline']['Row'], 'id' | 'created_at'>> & {
          relationship_id: string;
          event_type: TimelineEventType;
          title: string;
          event_date: string;
        };
        Update: Partial<Database['public']['Tables']['relationship_timeline']['Row']>;
        Relationships: [];
      };
      couple_xp_events: {
        Row: {
          id: string;
          relationship_id: string;
          user_id: string | null;
          source_type: XpSourceType;
          source_id: string | null;
          xp_amount: number;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_xp_events']['Row'], 'id' | 'created_at'>> & {
          relationship_id: string;
          source_type: XpSourceType;
          xp_amount: number;
        };
        Update: Partial<Database['public']['Tables']['couple_xp_events']['Row']>;
        Relationships: [];
      };
      couple_xp_totals: {
        Row: {
          relationship_id: string;
          total_xp: number;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_xp_totals']['Row'], 'updated_at'>> & {
          relationship_id: string;
        };
        Update: Partial<Database['public']['Tables']['couple_xp_totals']['Row']>;
        Relationships: [];
      };
      couple_badges: {
        Row: {
          id: string;
          relationship_id: string;
          badge_key: string;
          earned_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_badges']['Row'], 'id' | 'earned_at'>> & {
          relationship_id: string;
          badge_key: string;
        };
        Update: Partial<Database['public']['Tables']['couple_badges']['Row']>;
        Relationships: [];
      };
      couple_weekly_challenges: {
        Row: {
          id: string;
          relationship_id: string;
          week_start_date: string;
          challenge_key: string;
          status: 'in_progress' | 'completed';
          completed_at: string | null;
          xp_awarded: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_weekly_challenges']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          relationship_id: string;
          week_start_date: string;
          challenge_key: string;
        };
        Update: Partial<Database['public']['Tables']['couple_weekly_challenges']['Row']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          relationship_id: string | null;
          type: string;
          title: string;
          message: string;
          is_read: boolean;
          action_path: string | null;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>> & {
          user_id: string;
          type: string;
          title: string;
          message: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Row']>;
        Relationships: [];
      };
      partner_alerts: {
        Row: {
          id: string;
          relationship_id: string;
          sender_id: string;
          recipient_id: string;
          alert_type: PartnerAlertType;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['partner_alerts']['Row'], 'id' | 'created_at'>> & {
          relationship_id: string;
          sender_id: string;
          recipient_id: string;
          alert_type: PartnerAlertType;
        };
        Update: Partial<Database['public']['Tables']['partner_alerts']['Row']>;
        Relationships: [];
      };
      privacy_settings: {
        Row: {
          user_id: string;
          share_cycle_with_partner: boolean;
          share_mood_with_partner: boolean;
          share_symptoms_with_partner: boolean;
          share_journal_with_partner: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['privacy_settings']['Row'], 'created_at' | 'updated_at'>> & {
          user_id: string;
        };
        Update: Partial<Database['public']['Tables']['privacy_settings']['Row']>;
        Relationships: [];
      };
      /** Curated question bank for the Couple Q&A game. Seeded, not user-writable. */
      couple_questions: {
        Row: {
          id: string;
          question: string;
          category: 'LOVE' | 'FUN' | 'KNOW_ME' | 'MEMORIES' | 'FUTURE' | 'DEEP' | 'DATE_NIGHT';
          active: boolean;
          created_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_questions']['Row'], 'id' | 'created_at'>> & {
          question: string;
          category: string;
        };
        Update: Partial<Database['public']['Tables']['couple_questions']['Row']>;
        Relationships: [];
      };
      /** One answer per user per question per relationship. Reveal is enforced by RLS. */
      couple_question_answers: {
        Row: {
          id: string;
          question_id: string;
          relationship_id: string;
          user_id: string;
          answer: string;
          answered_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_question_answers']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          question_id: string;
          relationship_id: string;
          user_id: string;
          answer: string;
        };
        Update: Partial<Database['public']['Tables']['couple_question_answers']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      /** Live function returns just the new relationship's uuid, not a full row. */
      accept_couple_invite: {
        Args: { invite: string };
        Returns: string;
      };
      award_couple_xp: {
        Args: { p_relationship_id: string; p_user_id: string; p_source_type: string; p_source_id: string; p_xp_amount: number };
        Returns: void;
      };
      award_couple_badge: {
        Args: { p_relationship_id: string; p_badge_key: string };
        Returns: void;
      };
      get_or_create_weekly_challenge: {
        Args: { p_relationship_id: string };
        Returns: Database['public']['Tables']['couple_weekly_challenges']['Row'];
      };
      complete_weekly_challenge: {
        Args: { p_challenge_id: string };
        Returns: Database['public']['Tables']['couple_weekly_challenges']['Row'];
      };
      notify_relationship_connected: {
        Args: { p_relationship_id: string };
        Returns: void;
      };
      is_relationship_member: {
        Args: { p_relationship_id: string };
        Returns: boolean;
      };
      get_partner_id: {
        Args: { p_relationship_id: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
