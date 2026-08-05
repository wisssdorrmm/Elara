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

  /**
   * Ensures a profile row exists for this user, creating one if missing.
   * Safe to call on every sign-in/session-restore - if email confirmation was
   * required, no profile could be created at signUp time (RLS blocks inserts
   * without an active session), so this is what actually creates it once a
   * real session exists, whether that's immediately or after confirming.
   */
  async ensureProfileExists(userId: string): Promise<ServiceResult<Profile>> {
    const { data: existing, error: fetchError } = await profileService.getProfile(userId);
    if (fetchError) return { data: null, error: fetchError };
    if (existing) return { data: existing, error: null };
    return profileService.createInitialProfile(userId);
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
