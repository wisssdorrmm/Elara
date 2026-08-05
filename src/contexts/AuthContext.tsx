import { createContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
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
      // Covers the "immediate session" signup case, and any session restored
      // on page load (e.g. returning user, or just confirmed their email).
      if (s?.user) profileService.ensureProfileExists(s.user.id);
    });

    // Session persistence + auto-login across reloads is handled by the
    // Supabase client itself (persistSession: true in lib/supabase.ts);
    // this listener just keeps React state in sync with it, and makes sure
    // a profile row exists the moment a session becomes active - which for
    // email-confirmation signups happens later, when they click the link and
    // land back in the app (not at signUp() time, since RLS blocks that
    // insert without an active session).
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession?.user) profileService.ensureProfileExists(newSession.user.id);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp: AuthContextValue['signUp'] = async (email, password) => {
    const { data, error } = await authService.signUp(email, password);
    if (error) return { error, needsEmailConfirmation: false };

    // If a session came back immediately (email confirmation disabled on
    // this Supabase project), create the profile row right away. If not,
    // ensureProfileExists in the listener above will create it once they
    // actually confirm and a session exists.
    if (data && !data.needsEmailConfirmation) {
      const { error: profileError } = await profileService.createInitialProfile(data.userId);
      if (profileError) return { error: profileError, needsEmailConfirmation: false };
    }

    return { error: null, needsEmailConfirmation: data?.needsEmailConfirmation ?? false };
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
