import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { periodService } from '@/services/periodService';
import type { Database } from '@/types/database';

type Period = Database['public']['Tables']['periods']['Row'];

export function useActivePeriod() {
  const { user } = useAuth();
  const [activePeriod, setActivePeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivePeriod = useCallback(async () => {
    if (!user) {
      setActivePeriod(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await periodService.getActivePeriod(user.id);
    if (fetchError) {
      setError(fetchError);
    } else {
      setActivePeriod(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchActivePeriod();
  }, [fetchActivePeriod]);

  return { activePeriod, loading, error, refetch: fetchActivePeriod };
}
