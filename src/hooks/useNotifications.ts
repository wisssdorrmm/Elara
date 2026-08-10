import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { notificationService } from '@/services/notificationService';
import type { Database } from '@/types/database';

type Notification = Database['public']['Tables']['notifications']['Row'];

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const [{ data, error: fetchError }, { data: count }] = await Promise.all([
      notificationService.getNotifications(user.id),
      notificationService.getUnreadCount(user.id),
    ]);
    if (fetchError) {
      setError(fetchError);
    } else {
      setNotifications(data ?? []);
      setUnreadCount(count ?? 0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = useCallback(
    async (id: string) => {
      await notificationService.markAsRead(id);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    await notificationService.markAllAsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  }, [user]);

  return { notifications, unreadCount, loading, error, refetch: fetchNotifications, markAsRead, markAllAsRead };
}
