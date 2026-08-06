export type CycleGoal =
  | 'track_periods'
  | 'get_pregnant'
  | 'avoid_pregnancy'
  | 'understand_body'
  | 'manage_irregular_cycles';

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
