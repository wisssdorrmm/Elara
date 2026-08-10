import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';
import type { CheckinFeeling, PartnerAlertType } from '@/types';

type CoupleStreak = Database['public']['Tables']['couple_streaks']['Row'];
type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row'];
type Appreciation = Database['public']['Tables']['appreciations']['Row'];
type CoupleDate = Database['public']['Tables']['couple_dates']['Row'];
type TimelineEntry = Database['public']['Tables']['relationship_timeline']['Row'];
type XpTotal = Database['public']['Tables']['couple_xp_totals']['Row'];
type Badge = Database['public']['Tables']['couple_badges']['Row'];
type WeeklyChallenge = Database['public']['Tables']['couple_weekly_challenges']['Row'];
type PartnerAlert = Database['public']['Tables']['partner_alerts']['Row'];

export const coupleEngagementService = {
  // ---- Streaks ----------------------------------------------------------
  async getStreaks(relationshipId: string): Promise<ServiceResult<CoupleStreak[]>> {
    const { data, error } = await supabase.from('couple_streaks').select('*').eq('relationship_id', relationshipId);
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  // ---- Daily check-ins ----------------------------------------------------
  async getTodayCheckin(relationshipId: string, userId: string): Promise<ServiceResult<DailyCheckin>> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('relationship_id', relationshipId)
      .eq('user_id', userId)
      .eq('checkin_date', today)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async submitCheckin(
    relationshipId: string,
    userId: string,
    feeling: CheckinFeeling,
    note: string | null,
    isShared: boolean
  ): Promise<ServiceResult<DailyCheckin>> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('daily_checkins')
      .insert({ relationship_id: relationshipId, user_id: userId, checkin_date: today, feeling, note, is_shared: isShared })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async getRecentCheckins(relationshipId: string, days = 7): Promise<ServiceResult<DailyCheckin[]>> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('relationship_id', relationshipId)
      .gte('checkin_date', since.toISOString().slice(0, 10))
      .order('checkin_date', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  // ---- Appreciations ------------------------------------------------------
  async sendAppreciation(
    relationshipId: string,
    senderId: string,
    recipientId: string,
    message: string
  ): Promise<ServiceResult<Appreciation>> {
    const { data, error } = await supabase
      .from('appreciations')
      .insert({ relationship_id: relationshipId, sender_id: senderId, recipient_id: recipientId, message })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async getRecentAppreciations(relationshipId: string, limit = 10): Promise<ServiceResult<Appreciation[]>> {
    const { data, error } = await supabase
      .from('appreciations')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  // ---- Couple dates --------------------------------------------------------
  async getDates(relationshipId: string): Promise<ServiceResult<CoupleDate[]>> {
    const { data, error } = await supabase
      .from('couple_dates')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('date_on', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  async logDate(
    relationshipId: string,
    createdBy: string,
    entry: { title: string; date_on: string; location?: string | null; rating?: number | null; notes?: string | null }
  ): Promise<ServiceResult<CoupleDate>> {
    const { data, error } = await supabase
      .from('couple_dates')
      .insert({ relationship_id: relationshipId, created_by: createdBy, ...entry })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  // ---- Relationship timeline ------------------------------------------------
  async getTimeline(relationshipId: string): Promise<ServiceResult<TimelineEntry[]>> {
    const { data, error } = await supabase
      .from('relationship_timeline')
      .select('*')
      .eq('relationship_id', relationshipId)
      .order('event_date', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  // ---- XP -------------------------------------------------------------------
  async getXpTotal(relationshipId: string): Promise<ServiceResult<XpTotal>> {
    const { data, error } = await supabase
      .from('couple_xp_totals')
      .select('*')
      .eq('relationship_id', relationshipId)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  // ---- Badges -----------------------------------------------------------------
  async getBadges(relationshipId: string): Promise<ServiceResult<Badge[]>> {
    const { data, error } = await supabase.from('couple_badges').select('*').eq('relationship_id', relationshipId);
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  // ---- Weekly challenge ---------------------------------------------------------
  async getOrCreateWeeklyChallenge(relationshipId: string): Promise<ServiceResult<WeeklyChallenge>> {
    const { data, error } = await supabase.rpc('get_or_create_weekly_challenge', { p_relationship_id: relationshipId });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async completeWeeklyChallenge(challengeId: string): Promise<ServiceResult<WeeklyChallenge>> {
    const { data, error } = await supabase.rpc('complete_weekly_challenge', { p_challenge_id: challengeId });
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  // ---- Partner alerts ------------------------------------------------------------
  async sendPartnerAlert(
    relationshipId: string,
    senderId: string,
    recipientId: string,
    alertType: PartnerAlertType
  ): Promise<ServiceResult<PartnerAlert>> {
    const { data, error } = await supabase
      .from('partner_alerts')
      .insert({ relationship_id: relationshipId, sender_id: senderId, recipient_id: recipientId, alert_type: alertType })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  // ---- Connection notification (called once right after accept succeeds) ----------
  async notifyRelationshipConnected(relationshipId: string): Promise<ServiceResult> {
    const { error } = await supabase.rpc('notify_relationship_connected', { p_relationship_id: relationshipId });
    return { data: null, error: error?.message ?? null };
  },
};
