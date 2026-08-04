import { createContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getSession().then((s) => {
      setSession(s);
      setLoading(false);
    });

    // Session persistence + auto-login across reloads is handled by the
    // Supabase client itself (persistSession: true in lib/supabase.ts);
    // this listener just keeps React state in sync with it.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const { data, error } = await authService.signUp(email, password);
    if (error) return { error };

    // Every user gets a profile row immediately so onboarding-completion
    // checks (ProtectedRoute) always have something to read.
    if (data?.userId) {
      const { error: profileError } = await profileService.createInitialProfile(data.userId);
      if (profileError) return { error: profileError };
    }

    return { error: null };
  };

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    const { error } = await authService.signIn(email, password);
    return { error };
  };

  const signOut = async () => {
    await authService.signOut();
  };

  const resetPassword: AuthContextValue['resetPassword'] = async (email) => {
    const { error } = await authService.resetPassword(email);
    return { error };
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
