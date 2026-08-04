import { supabase } from '@/lib/supabase';
import type { ServiceResult } from './authService';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export const profileService = {
  async getProfile(userId: string): Promise<ServiceResult<Profile>> {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  /**
   * Called right after sign-up so every user has a profile row immediately,
   * with onboarding_completed=false until they finish the onboarding flow.
   */
  async createInitialProfile(userId: string): Promise<ServiceResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, onboarding_completed: false }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },

  async updateProfile(
    userId: string,
    updates: Omit<ProfileUpdate, 'id' | 'created_at' | 'updated_at'>
  ): Promise<ServiceResult<Profile>> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ user_id: userId, ...updates }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) return { data: null, error: error.message };
    return { data, error: null };
  },
};
