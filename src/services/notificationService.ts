import { supabase } from '@/lib/supabase';

export const notificationService = {
  async list(userId: string) {
    return supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(100);
  },
  async markRead(id: string) {
    return supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
  },
  async markAllRead(userId: string) {
    return supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', userId).is('read_at', null);
  },
};
