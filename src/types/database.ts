export type CycleGoal =
  | 'track_periods'
  | 'get_pregnant'
  | 'avoid_pregnancy'
  | 'understand_body'
  | 'manage_irregular_cycles';

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

export type RelationshipStatus = 'active' | 'ended';

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
    };
    Views: Record<string, never>;
    Functions: {
      /** Live function returns just the new relationship's uuid, not a full row. */
      accept_couple_invite: {
        Args: { invite: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
