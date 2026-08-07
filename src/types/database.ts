export type CycleGoal =
  | 'track_periods'
  | 'get_pregnant'
  | 'avoid_pregnancy'
  | 'understand_body'
  | 'manage_irregular_cycles';

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired';
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
      couple_invites: {
        Row: {
          id: string;
          inviter_id: string;
          invite_code: string;
          status: InviteStatus;
          created_at: string;
          expires_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['couple_invites']['Row'], 'id' | 'created_at'>> & {
          inviter_id: string;
          invite_code: string;
          expires_at: string;
        };
        Update: Partial<Database['public']['Tables']['couple_invites']['Row']>;
        Relationships: [];
      };
      relationships: {
        Row: {
          id: string;
          user_a_id: string;
          user_b_id: string;
          status: RelationshipStatus;
          started_at: string;
          anniversary_date: string | null;
          first_date_at: string | null;
          nickname: string | null;
          created_at: string;
          updated_at: string;
          ended_at: string | null;
        };
        Insert: Partial<Omit<Database['public']['Tables']['relationships']['Row'], 'id' | 'created_at' | 'updated_at'>> & {
          user_a_id: string;
          user_b_id: string;
          started_at: string;
        };
        Update: Partial<Database['public']['Tables']['relationships']['Row']>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      accept_couple_invite: {
        Args: { invite: string };
        Returns: Database['public']['Tables']['relationships']['Row'];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
