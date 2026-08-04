import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { periodService } from '@/services/periodService';
import type { Database } from '@/types/database';

type Period = Database['public']['Tables']['periods']['Row'];

export function usePeriods() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    if (!user) {
      setPeriods([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await periodService.getPeriods(user.id);
    if (fetchError) {
      setError(fetchError);
    } else {
      setPeriods(data ?? []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  return { periods, loading, error, refetch: fetchPeriods };
}
