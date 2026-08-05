import { supabase } from '@/lib/supabase';

export interface ServiceResult<T = null> {
  data: T | null;
  error: string | null;
}

export const authService = {
  async signUp(email: string, password: string): Promise<ServiceResult<{ userId: string; needsEmailConfirmation: boolean }>> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { data: null, error: error.message };
    if (!data.user) return { data: null, error: 'Sign up succeeded but no user was returned.' };
    // If Supabase's "Confirm email" setting is on, signUp succeeds but returns
    // no active session until the user clicks the emailed link.
    const needsEmailConfirmation = !data.session;
    return { data: { userId: data.user.id, needsEmailConfirmation }, error: null };
  },

  async signIn(email: string, password: string): Promise<ServiceResult> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { data: null, error: error?.message ?? null };
  },

  async signOut(): Promise<ServiceResult> {
    const { error } = await supabase.auth.signOut();
    return { data: null, error: error?.message ?? null };
  },

  async resetPassword(email: string): Promise<ServiceResult> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { data: null, error: error?.message ?? null };
  },

  async updatePassword(newPassword: string): Promise<ServiceResult> {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { data: null, error: error?.message ?? null };
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onAuthStateChange(callback: Parameters<typeof supabase.auth.onAuthStateChange>[0]) {
    return supabase.auth.onAuthStateChange(callback);
  },
};
