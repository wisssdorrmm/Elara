import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { profileService } from '@/services/profileService';
import type { Database } from '@/types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await profileService.getProfile(user.id);
    if (fetchError) {
      setError(fetchError);
    } else {
      setProfile(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = useCallback(
    async (updates: ProfileUpdate) => {
      if (!user) return { error: 'Not signed in' };
      const { data, error: updateError } = await profileService.updateProfile(user.id, updates);
      if (updateError) return { error: updateError };
      setProfile(data);
      return { error: null };
    },
    [user]
  );

  return { profile, loading, error, refetch: fetchProfile, updateProfile };
}
