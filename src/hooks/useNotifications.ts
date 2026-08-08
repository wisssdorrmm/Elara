import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '@/services/notificationService';
import type { Database } from '@/types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error: fetchError } = await notificationService.list(user.id);
    setNotifications(data ?? []);
    setError(fetchError?.message ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => { refetch(); }, [refetch]);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markRead = async (id: string) => {
    const { error: updateError } = await notificationService.markRead(id);
    if (!updateError) setNotifications((items) => items.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
    return updateError;
  };

  const markAllRead = async () => {
    if (!user) return null;
    const { error: updateError } = await notificationService.markAllRead(user.id);
    if (!updateError) setNotifications((items) => items.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
    return updateError;
  };

  return { notifications, unreadCount, loading, error, refetch, markRead, markAllRead };
}
