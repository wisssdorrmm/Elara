import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';

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

  /** The currently open period, if any (end_date is null). Period and Flow are managed separately now - this never touches flow. */
  async getActivePeriod(userId: string): Promise<ServiceResult<Period>> {
    const { data, error } = await supabase
      .from('periods')
      .select('*')
      .eq('user_id', userId)
      .is('end_date', null)
      .order('start_date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /** Starts a new period. Refuses if one is already active - end it first. */
  async startPeriod(userId: string, startDate: string): Promise<ServiceResult<Period>> {
    const { data: active, error: activeError } = await periodService.getActivePeriod(userId);
    if (activeError) return { data: null, error: activeError };
    if (active) return { data: null, error: 'You already have an active period. End it before starting a new one.' };

    return periodService.createPeriod(userId, { start_date: startDate });
  },

  /** Ends the given period by setting its end_date. */
  async endPeriod(periodId: string, endDate: string): Promise<ServiceResult<Period>> {
    return periodService.updatePeriod(periodId, { end_date: endDate });
  },

  /** Used by Onboarding for the one-time "when did your last period start" answer. */
  async createPeriod(userId: string, period: Omit<PeriodInsert, 'user_id'>): Promise<ServiceResult<Period>> {
    const { data, error } = await supabase
      .from('periods')
      .insert({ user_id: userId, ...period })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /** Used by "Edit Current Period" (dates only - flow lives on `logs` now, never here). */
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
