import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { logService } from '@/services/logService';
import type { Database } from '@/types/database';

type Log = Database['public']['Tables']['logs']['Row'];

export function useLogs(startDate?: string, endDate?: string) {
  const { user } = useAuth();
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!user || !startDate || !endDate) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await logService.getLogsInRange(user.id, startDate, endDate);
    if (fetchError) {
      setError(fetchError);
    } else {
      setLogs(data ?? []);
    }
    setLoading(false);
  }, [user, startDate, endDate]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return { logs, loading, error, refetch: fetchLogs };
}
