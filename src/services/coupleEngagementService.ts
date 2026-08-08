import { format, startOfWeek } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';
import type { AlertType, CoupleFeeling, StreakType } from '@/types/couple';

type Tables = Database['public']['Tables'];
const today = () => format(new Date(), 'yyyy-MM-dd');

export const coupleEngagementService = {
  async getStats(relationshipId: string): Promise<ServiceResult<{ streak: Tables['couple_streaks']['Row'] | null; xp: number; dates: number; averageRating: number | null; checkins: number; appreciations: number }>> {
    const [streak, xp, dates, ratings, checkins, appreciations] = await Promise.all([
      supabase.from('couple_streaks').select('*').eq('relationship_id', relationshipId).eq('streak_type', 'daily_checkin').maybeSingle(),
      supabase.from('couple_xp_events').select('xp').eq('relationship_id', relationshipId),
      supabase.from('couple_dates').select('id', { count: 'exact', head: true }).eq('relationship_id', relationshipId),
      supabase.from('couple_dates').select('rating').eq('relationship_id', relationshipId).not('rating', 'is', null),
      supabase.from('couple_checkins').select('id', { count: 'exact', head: true }).eq('relationship_id', relationshipId),
      supabase.from('couple_appreciations').select('id', { count: 'exact', head: true }).eq('relationship_id', relationshipId),
    ]);
    const error = [streak, xp, dates, ratings, checkins, appreciations].find((r) => r.error)?.error;
    if (error) return { data: null, error: error.message };
    const ratingValues = (ratings.data ?? []).map((r) => r.rating).filter((r): r is number => r !== null);
    return {
      data: {
        streak: streak.data,
        xp: (xp.data ?? []).reduce((sum, row) => sum + row.xp, 0),
        dates: dates.count ?? 0,
        averageRating: ratingValues.length ? ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length : null,
        checkins: checkins.count ?? 0,
        appreciations: appreciations.count ?? 0,
      },
      error: null,
    };
  },


  async getWeeklySummary(relationshipId: string) {
    const start = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const [checkins, appreciations, dates, challenges] = await Promise.all([
      supabase.from('couple_checkins').select('id').eq('relationship_id', relationshipId).gte('checkin_date', start),
      supabase.from('couple_appreciations').select('id').eq('relationship_id', relationshipId).gte('created_at', `${start}T00:00:00.000Z`),
      supabase.from('couple_dates').select('id').eq('relationship_id', relationshipId).gte('date_on', start),
      supabase.from('couple_challenge_progress').select('id').eq('relationship_id', relationshipId).eq('completed', true).gte('completed_at', `${start}T00:00:00.000Z`),
    ]);
    const error = [checkins, appreciations, dates, challenges].find(r => r.error)?.error;
    return { data: error ? null : { checkins: checkins.data?.length ?? 0, appreciations: appreciations.data?.length ?? 0, dates: dates.data?.length ?? 0, challenges: challenges.data?.length ?? 0 }, error: error?.message ?? null };
  },

  async syncBadges(relationshipId: string, stats: { checkins:number; dates:number; xp:number; streak:number; appreciations:number }) {
    const { data: badges } = await supabase.from('couple_badges').select('*');
    const rules: Record<string, boolean> = {
      first_checkin: stats.checkins >= 1, first_date: stats.dates >= 1, seven_day_streak: stats.streak >= 7,
      thirty_day_streak: stats.streak >= 30, appreciation_master: stats.appreciations >= 5, golden_hearts: stats.xp >= 700,
    };
    for (const badge of badges ?? []) if (rules[badge.code]) await supabase.from('couple_relationship_badges').upsert({ relationship_id: relationshipId, badge_id: badge.id }, { onConflict: 'relationship_id,badge_id' });
    return supabase.from('couple_relationship_badges').select('*, couple_badges(*)').eq('relationship_id', relationshipId);
  },
  async saveCheckin(relationshipId: string, userId: string, feeling: CoupleFeeling, note: string, isShared: boolean): Promise<ServiceResult> {
    const { error } = await supabase.from('couple_checkins').upsert({ relationship_id: relationshipId, user_id: userId, checkin_date: today(), feeling, note: note.trim() || null, is_shared: isShared, shared_at: isShared ? new Date().toISOString() : null }, { onConflict: 'relationship_id,user_id,checkin_date' });
    if (error) return { data: null, error: error.message };
    await this.awardXp(relationshipId, userId, 'daily_checkin', `${userId}:${today()}`, 10);
    await this.recordStreak(relationshipId, userId, 'daily_checkin', today(), 'checkin');
    return { data: null, error: null };
  },

  async sendAppreciation(relationshipId: string, senderId: string, recipientId: string, message: string): Promise<ServiceResult> {
    const { data, error } = await supabase.from('couple_appreciations').insert({ relationship_id: relationshipId, sender_id: senderId, recipient_id: recipientId, message }).select().single();
    if (error) return { data: null, error: error.message };
    await this.awardXp(relationshipId, senderId, 'appreciation', data.id, 5);
    await this.recordStreak(relationshipId, senderId, 'appreciation', today(), data.id);
    const { error: notificationError } = await supabase.rpc('send_partner_notification', { p_relationship_id: relationshipId, p_recipient_id: recipientId, p_type: 'appreciation', p_title: 'A little appreciation 💌', p_message: message, p_action_path: '/couple/dashboard' });
    return { data: null, error: notificationError?.message ?? null };
  },

  async createDate(relationshipId: string, userId: string, input: { title: string; date_on: string; location?: string; rating?: number; notes?: string }): Promise<ServiceResult> {
    const { data, error } = await supabase.from('couple_dates').insert({ relationship_id: relationshipId, created_by: userId, ...input, location: input.location || null, rating: input.rating || null, notes: input.notes || null }).select().single();
    if (error) return { data: null, error: error.message };
    await this.awardXp(relationshipId, userId, 'date', data.id, 20);
    await this.recordStreak(relationshipId, userId, 'date_night', input.date_on, data.id);
    await supabase.from('couple_timeline_events').insert({ relationship_id: relationshipId, created_by: userId, event_type: 'memory', title: input.title, event_date: input.date_on, description: input.notes || null });
    return { data, error: null };
  },

  async getDates(relationshipId: string) { return supabase.from('couple_dates').select('*').eq('relationship_id', relationshipId).order('date_on', { ascending: false }); },
  async getTimeline(relationshipId: string) { return supabase.from('couple_timeline_events').select('*').eq('relationship_id', relationshipId).order('event_date', { ascending: false }); },
  async getMyCheckin(relationshipId: string, userId: string) { return supabase.from('couple_checkins').select('*').eq('relationship_id', relationshipId).eq('user_id', userId).eq('checkin_date', today()).maybeSingle(); },
  async getChallenge(relationshipId: string) {
    const week = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
    const { data: challenge, error } = await supabase.from('couple_challenges').select('*').eq('week_start', week).maybeSingle();
    if (error || !challenge) return { challenge: null, progress: null, error: error?.message ?? null };
    const { data: progress, error: progressError } = await supabase.from('couple_challenge_progress').select('*').eq('relationship_id', relationshipId).eq('challenge_id', challenge.id).maybeSingle();
    return { challenge, progress, error: progressError?.message ?? null };
  },
  async completeChallenge(relationshipId: string, userId: string, challengeId: string, xp: number) {
    const { data, error } = await supabase.from('couple_challenge_progress').upsert({ relationship_id: relationshipId, challenge_id: challengeId, completed_by: userId, progress: 1, completed: true, completed_at: new Date().toISOString() }, { onConflict: 'relationship_id,challenge_id' }).select().single();
    if (error) return { data: null, error: error.message };
    await this.awardXp(relationshipId, userId, 'challenge', challengeId, xp);
    await this.recordStreak(relationshipId, userId, 'challenge', today(), challengeId);
    return { data, error: null };
  },
  async awardXp(relationshipId: string, userId: string, source: string, sourceKey: string, xp: number) {
    await supabase.from('couple_xp_events').insert({ relationship_id: relationshipId, user_id: userId, source, source_key: sourceKey, xp });
  },
  async recordStreak(relationshipId: string, userId: string, streakType: StreakType, activityDate: string, source: string) {
    const { error: eventError } = await supabase.from('couple_streak_events').insert({ relationship_id: relationshipId, user_id: userId, streak_type: streakType, activity_date: activityDate, source });
    if (eventError && eventError.code !== '23505') return eventError.message;
    const { data: rows } = await supabase.from('couple_streak_events').select('activity_date').eq('relationship_id', relationshipId).eq('streak_type', streakType).order('activity_date', { ascending: false }).limit(365);
    const uniqueDates = [...new Set((rows ?? []).map((r) => r.activity_date))].sort().reverse();
    let current = 0;
    const latest = uniqueDates[0];
    if (latest) {
      const latestTime = new Date(latest + 'T00:00:00').getTime();
      const activityTime = new Date(activityDate + 'T00:00:00').getTime();
      const gap = Math.round((activityTime - latestTime) / 86400000);
      if (gap === 0) {
        let expected = latestTime;
        for (const date of uniqueDates) {
          const t = new Date(date + 'T00:00:00').getTime();
          if (Math.round((expected - t) / 86400000) === 0) {
            current++;
            expected -= 86400000;
          } else if (Math.round((expected - t) / 86400000) === 1) {
            current++;
            expected = t - 86400000;
          } else break;
        }
      }
    }
    // The event list is shared by both partners; consecutive calendar dates count once.
    const dates = uniqueDates.map((d) => new Date(d + 'T00:00:00').getTime()).sort((a,b)=>a-b);
    let longest = dates.length ? 1 : 0, run = 1;
    for (let i=1;i<dates.length;i++) { if (Math.round((dates[i]-dates[i-1])/86400000) === 1) run++; else run=1; longest=Math.max(longest,run); }
    await supabase.from('couple_streaks').upsert({ relationship_id: relationshipId, streak_type: streakType, current_count: current, longest_count: longest, last_activity_date: activityDate }, { onConflict: 'relationship_id,streak_type' });
    return null;
  },
  async sendAlert(relationshipId: string, senderId: string, recipientId: string, alertType: AlertType): Promise<ServiceResult> {
    const labels: Record<AlertType, [string, string]> = {
      thinking_of_you: ['Thinking of you ❤️', 'Your partner is thinking of you.'],
      sending_love: ['Sending you love 💕', 'Your partner sent you some love.'],
      here_for_you: ['I’m here for you 🫶', 'Your partner wants you to know they are here for you.'],
      hope_you_are_well: ['Hope you’re having a good day 😊', 'Your partner is thinking about how you are doing.'],
      feeling_down: ['I’m feeling down 🥺', 'Your partner could use a little care today.'],
      call_me: ['Call me 📞', 'Your partner would like to talk.'],
    };
    const { error } = await supabase.from('couple_alerts').insert({ relationship_id: relationshipId, sender_id: senderId, recipient_id: recipientId, alert_type: alertType });
    if (error) return { data: null, error: error.message };
    const [title, message] = labels[alertType];
    const { error: notifyError } = await supabase.rpc('send_partner_notification', { p_relationship_id: relationshipId, p_recipient_id: recipientId, p_type: 'partner_alert', p_title: title, p_message: message, p_action_path: '/couple/dashboard' });
    return { data: null, error: notifyError?.message ?? null };
  },
};
