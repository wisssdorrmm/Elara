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

  /** Logs or updates flow for a specific day - used by the daily "Log Flow" screen. */
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
