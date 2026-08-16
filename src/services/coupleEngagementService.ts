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
type CoupleQuestion = Database['public']['Tables']['couple_questions']['Row'];
type CoupleQuestionAnswer = Database['public']['Tables']['couple_question_answers']['Row'];

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

  // ---- Couple Question & Answer game --------------------------------------------
  /**
   * Fetches today's question deterministically. Both partners get the SAME
   * question for the same day regardless of timezone: we pick the question
   * by (days since a fixed epoch) % (active question count). This avoids
   * random selection and timezone drift.
   */
  async getTodayQuestion(): Promise<ServiceResult<CoupleQuestion>> {
    const { data, error } = await supabase
      .from('couple_questions')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (error) return { data: null, error: error.message };
    if (!data || data.length === 0) return { data: null, error: 'No questions available yet.' };

    const EPOCH = new Date('2026-01-01T00:00:00Z').getTime();
    const today = new Date();
    const dayNumber = Math.floor((today.getTime() - EPOCH) / (24 * 60 * 60 * 1000));
    const index = ((dayNumber % data.length) + data.length) % data.length;
    return { data: data[index], error: null };
  },

  /** Fetches the current user's answer for a given question in a relationship. */
  async getMyAnswer(questionId: string, relationshipId: string, userId: string): Promise<ServiceResult<CoupleQuestionAnswer>> {
    const { data, error } = await supabase
      .from('couple_question_answers')
      .select('*')
      .eq('question_id', questionId)
      .eq('relationship_id', relationshipId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /**
   * Fetches all answers for a question in a relationship. RLS enforces the
   * reveal rule: the partner's answer is only returned once BOTH partners
   * have answered. If only one has answered, only that user's own answer
   * is returned.
   */
  async getAnswers(questionId: string, relationshipId: string): Promise<ServiceResult<CoupleQuestionAnswer[]>> {
    const { data, error } = await supabase
      .from('couple_question_answers')
      .select('*')
      .eq('question_id', questionId)
      .eq('relationship_id', relationshipId);
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  /**
   * Submits (or updates) the current user's answer. Upsert on the unique
   * (question_id, relationship_id, user_id) so a user can never create
   * duplicate answers — re-submitting edits their existing answer.
   */
  async submitAnswer(
    questionId: string,
    relationshipId: string,
    userId: string,
    answer: string
  ): Promise<ServiceResult<CoupleQuestionAnswer>> {
    const trimmed = answer.trim();
    if (!trimmed) return { data: null, error: 'Answer cannot be empty.' };
    if (trimmed.length > 1000) return { data: null, error: 'Answer must be 1000 characters or fewer.' };

    const { data, error } = await supabase
      .from('couple_question_answers')
      .upsert(
        { question_id: questionId, relationship_id: relationshipId, user_id: userId, answer: trimmed },
        { onConflict: 'question_id,relationship_id,user_id' }
      )
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /**
   * Saves a completed Q&A exchange as a memory in the existing
   * relationship_timeline table (event_type = 'memory'). Reuses the existing
   * memory/timeline system — no second memory system.
   */
  async saveQuestionToMemory(
    relationshipId: string,
    userId: string,
    question: string,
    myAnswer: string,
    partnerAnswer: string
  ): Promise<ServiceResult<TimelineEntry>> {
    const description = `Q: ${question}\n\nYou: ${myAnswer}\n\nPartner: ${partnerAnswer}`;
    const { data, error } = await supabase
      .from('relationship_timeline')
      .insert({
        relationship_id: relationshipId,
        created_by: userId,
        event_type: 'memory',
        title: 'Couple Question 💕',
        description,
        event_date: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },
};
