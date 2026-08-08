import { Bell, CheckCheck, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, error, refetch, markRead, markAllRead } = useNotifications();

  return <div>
    <Navbar title="Notifications" showBack />
    <div className="app-page pt-0">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-text-muted">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
        {unreadCount > 0 && <button onClick={markAllRead} className="flex items-center gap-1.5 text-sm font-semibold text-primary"><CheckCheck className="h-4 w-4" /> Mark all read</button>}
      </div>
      {loading ? <Loading /> : error ? <ErrorState message="We couldn't load your notifications." onRetry={refetch} /> : notifications.length === 0 ? <Card><div className="py-8 text-center"><Bell className="mx-auto mb-3 h-9 w-9 text-primary/50" /><p className="font-semibold text-text">No notifications yet</p><p className="mt-1 text-sm text-text-muted">You'll see partner activity, streak milestones and reminders here.</p></div></Card> : <div className="space-y-2">{notifications.map(n => <button key={n.id} onClick={async () => { if (!n.read_at) await markRead(n.id); if (n.action_path) navigate(n.action_path); }} className={`w-full rounded-card border p-4 text-left shadow-card ${n.read_at ? 'border-gray-100 bg-white' : 'border-primary/20 bg-primary/5'}`}><div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10"><Bell className="h-4 w-4 text-primary" /></span><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><p className="font-semibold text-text">{n.title}</p>{!n.read_at && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />}</div><p className="mt-1 text-sm text-text-muted">{n.message}</p><p className="mt-2 text-xs text-text-muted">{formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}</p></div><ChevronRight className="mt-1 h-4 w-4 text-text-muted" /></div></button>)}</div>}
      <Button variant="ghost" className="mt-5" onClick={() => navigate('/couple')}>Back to Couple</Button>
    </div>
  </div>;
}
