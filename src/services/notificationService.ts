import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];

export const notificationService = {
  async getNotifications(userId: string, limit = 50): Promise<ServiceResult<Notification[]>> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) return { data: null, error: error.message };
    return { data: data ?? [], error: null };
  },

  async getUnreadCount(userId: string): Promise<ServiceResult<number>> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);
    if (error) return { data: null, error: error.message };
    return { data: count ?? 0, error: null };
  },

  async markAsRead(notificationId: string): Promise<ServiceResult> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId);
    return { data: null, error: error?.message ?? null };
  },

  async markAllAsRead(userId: string): Promise<ServiceResult> {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
    return { data: null, error: error?.message ?? null };
  },
};
