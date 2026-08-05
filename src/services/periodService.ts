import { differenceInCalendarDays } from 'date-fns';
import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';
import type { FlowIntensity } from '@/types';

type Period = Database['public']['Tables']['periods']['Row'];
type PeriodInsert = Database['public']['Tables']['periods']['Insert'];
type PeriodUpdate = Database['public']['Tables']['periods']['Update'];

export const periodService = {
  async getPeriods(userId: string): Promise<ServiceResult<Period[]>> {
    const { data, error } = await supabase
      .from('periods')
      .select('*')
      .eq('user_id', userId)
      .order('start_date', { ascending: false });
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  async getPeriodById(id: string, userId: string): Promise<ServiceResult<Period>> {
    const { data, error } = await supabase.from('periods').select('*').eq('id', id).eq('user_id', userId).maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /**
   * Logs flow for a specific day as part of ONE continuous period, instead of
   * creating a separate period row per day. Rules:
   *  - No periods yet, or a real gap (2+ days) since the last logged day -> start a new period.
   *  - The date falls within [start_date, end_date] of the most recent period -> just update its flow.
   *  - The date is exactly the day after the most recent period's last known day -> extend end_date forward.
   *  - The date is exactly the day before the most recent period's start_date -> extend start_date backward.
   * This is what LogFlow.tsx should call - NOT upsertPeriodForDate (kept below for the
   * one-time "last period start" write during onboarding, which has no continuation logic).
   */
  async logFlowForDate(userId: string, date: string, flow: FlowIntensity): Promise<ServiceResult<Period>> {
    const { data: periods, error: fetchError } = await periodService.getPeriods(userId);
    if (fetchError) return { data: null, error: fetchError };

    const mostRecent = periods?.[0] ?? null;

    if (!mostRecent) {
      return periodService.createPeriod(userId, { start_date: date, flow });
    }

    const lastKnownDay = mostRecent.end_date ?? mostRecent.start_date;

    // Already within the known range of the most recent period - just update flow.
    if (date >= mostRecent.start_date && date <= lastKnownDay) {
      return periodService.updatePeriod(mostRecent.id, { flow });
    }

    const gapForward = differenceInCalendarDays(new Date(date), new Date(lastKnownDay));
    if (gapForward === 1) {
      return periodService.updatePeriod(mostRecent.id, { end_date: date, flow });
    }

    const gapBackward = differenceInCalendarDays(new Date(mostRecent.start_date), new Date(date));
    if (gapBackward === 1) {
      return periodService.updatePeriod(mostRecent.id, { start_date: date, flow });
    }

    // A real gap (2+ days) since any known activity on the most recent period - new period.
    return periodService.createPeriod(userId, { start_date: date, flow });
  },

  /** One-time write used by Onboarding for "when did your last period start" - no continuation logic. */
  async upsertPeriodForDate(userId: string, startDate: string, updates: Omit<PeriodInsert, 'user_id' | 'start_date'>): Promise<ServiceResult<Period>> {
    const { data, error } = await supabase
      .from('periods')
      .upsert({ user_id: userId, start_date: startDate, ...updates }, { onConflict: 'user_id,start_date' })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async createPeriod(userId: string, period: Omit<PeriodInsert, 'user_id'>): Promise<ServiceResult<Period>> {
    const { data, error } = await supabase
      .from('periods')
      .insert({ user_id: userId, ...period })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async updatePeriod(id: string, updates: PeriodUpdate): Promise<ServiceResult<Period>> {
    const { data, error } = await supabase.from('periods').update(updates).eq('id', id).select().single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async deletePeriod(id: string): Promise<ServiceResult> {
    const { error } = await supabase.from('periods').delete().eq('id', id);
    return { data: null, error: error?.message ?? null };
  },
};
