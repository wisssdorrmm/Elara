import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useNotifications } from '@/hooks/useNotifications';
import { cn } from '@/utils/cn';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, refetch, markAsRead, markAllAsRead } = useNotifications();

  const handleOpen = async (id: string, isRead: boolean, actionPath: string | null) => {
    if (!isRead) await markAsRead(id);
    if (actionPath) navigate(actionPath);
  };

  return (
    <div>
      <Navbar
        title="Notifications"
        showBack
        right={
          unreadCount > 0 ? (
            <button onClick={markAllAsRead} className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </button>
          ) : undefined
        }
      />
      <div className="app-page space-y-2.5 pt-0">
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message="We couldn't load your notifications." onRetry={refetch} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications yet"
            description="You'll see updates here — partner activity, streak milestones, and reminders — once they happen."
          />
        ) : (
          notifications.map((n) => (
            <Card
              key={n.id}
              interactive
              onClick={() => handleOpen(n.id, n.is_read, n.action_path)}
              padding="sm"
              className={cn('relative', !n.is_read && 'bg-primary/5')}
            >
              <div className="flex items-start gap-3">
                {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                <div className={cn('flex-1', n.is_read && 'pl-5')}>
                  <p className="text-sm font-semibold text-text">{n.title}</p>
                  <p className="text-sm text-text-muted">{n.message}</p>
                  <p className="mt-1 text-xs text-text-muted">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
