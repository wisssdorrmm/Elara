export type CycleGoal =
  | 'track_periods'
  | 'get_pregnant'
  | 'avoid_pregnancy'
  | 'understand_body'
  | 'manage_irregular_cycles';
export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy' | 'very_heavy';
export type RelationshipStatus = 'active' | 'ended';

type AnyTable<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };

export interface Database {
  public: {
    Tables: {
      profiles: AnyTable<{ id:string; user_id:string; full_name:string|null; date_of_birth:string|null; country:string|null; goal:CycleGoal|null; average_cycle_length:number; average_period_length:number; cycle_is_regular:boolean|null; reminder_days_before:number[]; reminder_time:string; notifications_enabled:boolean; onboarding_completed:boolean; created_at:string; updated_at:string }>;
      periods: AnyTable<{ id:string; user_id:string; start_date:string; end_date:string|null; created_at:string; updated_at:string }>;
      logs: AnyTable<{ id:string; user_id:string; log_date:string; flow:FlowIntensity|null; symptoms:string[]; mood:string|null; pain_level:number|null; sleep_hours:number|null; notes:string|null; created_at:string; updated_at:string }>;
      couple_invites: AnyTable<{ id:string; inviter_id:string; invite_code:string; revoked:boolean; created_at:string; expires_at:string; accepted_by:string|null; accepted_at:string|null; relationship_id:string|null }>;
      relationships: AnyTable<{ id:string; user_one_id:string; user_two_id:string; status:RelationshipStatus; relationship_start_date:string; anniversary:string|null; partner_birthday:string|null; first_date:string|null; created_at:string; updated_at:string }>;
      couple_streaks: AnyTable<{ id:string; relationship_id:string; streak_type:string; current_count:number; longest_count:number; last_activity_date:string|null; created_at:string; updated_at:string }>;
      couple_streak_events: AnyTable<{ id:string; relationship_id:string; streak_type:string; user_id:string; activity_date:string; source:string; created_at:string }>;
      couple_dates: AnyTable<{ id:string; relationship_id:string; created_by:string; title:string; date_on:string; location:string|null; rating:number|null; notes:string|null; photo_url:string|null; created_at:string; updated_at:string }>;
      couple_timeline_events: AnyTable<{ id:string; relationship_id:string; created_by:string; event_type:string; title:string; event_date:string; description:string|null; created_at:string; updated_at:string }>;
      couple_checkins: AnyTable<{ id:string; relationship_id:string; user_id:string; checkin_date:string; feeling:string; note:string|null; is_shared:boolean; shared_at:string|null; created_at:string; updated_at:string }>;
      couple_appreciations: AnyTable<{ id:string; relationship_id:string; sender_id:string; recipient_id:string; message:string; created_at:string }>;
      couple_challenges: AnyTable<{ id:string; title:string; description:string; week_start:string; week_end:string; xp_reward:number; created_at:string }>;
      couple_challenge_progress: AnyTable<{ id:string; relationship_id:string; challenge_id:string; completed_by:string|null; progress:number; completed:boolean; completed_at:string|null; created_at:string; updated_at:string }>;
      couple_xp_events: AnyTable<{ id:string; relationship_id:string; user_id:string|null; source:string; source_key:string; xp:number; created_at:string }>;
      couple_badges: AnyTable<{ id:string; code:string; name:string; description:string; icon:string; created_at:string }>;
      couple_relationship_badges: AnyTable<{ id:string; relationship_id:string; badge_id:string; unlocked_at:string }>;
      notifications: AnyTable<{ id:string; user_id:string; relationship_id:string|null; type:string; title:string; message:string; action_path:string|null; read_at:string|null; created_at:string }>;
      couple_alerts: AnyTable<{ id:string; relationship_id:string; sender_id:string; recipient_id:string; alert_type:string; created_at:string }>;
    };
    Views: Record<string, never>;
    Functions: {
      accept_couple_invite: { Args: { invite:string }; Returns:string };
      send_partner_notification: { Args: { p_relationship_id:string; p_recipient_id:string; p_type:string; p_title:string; p_message:string; p_action_path?:string|null }; Returns:string };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
