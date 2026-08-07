import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { coupleService } from '@/services/coupleService';
import type { Database } from '@/types/database';

type Relationship = Database['public']['Tables']['relationships']['Row'];

export function useRelationship() {
  const { user } = useAuth();
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRelationship = useCallback(async () => {
    if (!user) {
      setRelationship(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await coupleService.getMyRelationship(user.id);
    if (fetchError) {
      setError(fetchError);
    } else {
      setRelationship(data);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRelationship();
  }, [fetchRelationship]);

  return { relationship, loading, error, refetch: fetchRelationship };
}
