import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';

type Log = Database['public']['Tables']['logs']['Row'];
type LogUpdate = Database['public']['Tables']['logs']['Update'];

export const logService = {
  async getLogByDate(userId: string, date: string): Promise<ServiceResult<Log>> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .eq('log_date', date)
      .maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async getLogsInRange(userId: string, startDate: string, endDate: string): Promise<ServiceResult<Log[]>> {
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('user_id', userId)
      .gte('log_date', startDate)
      .lte('log_date', endDate)
      .order('log_date', { ascending: true });
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  async upsertLog(
    userId: string,
    date: string,
    updates: Omit<LogUpdate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResult<Log>> {
    const { data, error } = await supabase
      .from('logs')
      .upsert({ user_id: userId, log_date: date, ...updates }, { onConflict: 'user_id,log_date' })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async deleteLog(id: string): Promise<ServiceResult> {
    const { error } = await supabase.from('logs').delete().eq('id', id);
    return { data: null, error: error?.message ?? null };
  },
};
