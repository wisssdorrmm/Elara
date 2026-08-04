import { useNavigate } from 'react-router-dom';
import { Calendar, Bell, Shield, HelpCircle, Info, ChevronRight, Pencil } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';

const menuItems = [
  { label: 'Privacy', icon: Shield, path: '/settings' },
  { label: 'Help & support', icon: HelpCircle, path: '/settings' },
  { label: 'About HerCycle', icon: Info, path: '/settings' },
];

export default function Profile() {
  const { user, signOut } = useAuth();
  const { profile, loading, error, refetch } = useProfile();
  const navigate = useNavigate();

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'User';
  const reminderDays = profile?.reminder_days_before?.length
    ? profile.reminder_days_before
        .slice()
        .sort((a, b) => b - a)
        .map((d) => (d === 0 ? 'Day of' : `${d}d`))
        .join(', ')
    : 'Not set';

  if (loading) return <SkeletonCard />;
  if (error) return <ErrorState message="We couldn't load your profile." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Avatar name={displayName} size="lg" />
        <div>
          <p className="text-lg font-bold text-text">{displayName}</p>
          <p className="text-sm text-text-muted">{user?.email}</p>
        </div>
      </div>

      <Card>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Cycle length</p>
            <p className="font-semibold text-text">{profile?.average_cycle_length ?? 28} days</p>
          </div>
          <div>
            <p className="text-text-muted">Period length</p>
            <p className="font-semibold text-text">{profile?.average_period_length ?? 5} days</p>
          </div>
          <div>
            <p className="text-text-muted">Reminders</p>
            <p className="font-semibold text-text">{reminderDays}</p>
          </div>
          <div>
            <p className="text-text-muted">Reminder time</p>
            <p className="font-semibold text-text">{profile?.reminder_time?.slice(0, 5) ?? '08:00'}</p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" icon={<Pencil className="h-4 w-4" />} onClick={() => navigate('/profile/edit')}>
          Edit Profile
        </Button>
        <Button variant="outline" icon={<Calendar className="h-4 w-4" />} onClick={() => navigate('/history')}>
          View History
        </Button>
      </div>

      <div className="overflow-hidden rounded-card bg-white shadow-card">
        <button
          onClick={() => navigate('/profile/edit')}
          className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left"
        >
          <Bell className="h-5 w-5 text-text-muted" />
          <span className="flex-1 text-sm font-medium text-text">Reminder preferences</span>
          <ChevronRight className="h-4 w-4 text-text-muted" />
        </button>
        {menuItems.map(({ label, icon: Icon, path }, i) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`flex w-full items-center gap-3 px-4 py-4 text-left ${i !== menuItems.length - 1 ? 'border-b border-gray-100' : ''}`}
          >
            <Icon className="h-5 w-5 text-text-muted" />
            <span className="flex-1 text-sm font-medium text-text">{label}</span>
            <ChevronRight className="h-4 w-4 text-text-muted" />
          </button>
        ))}
      </div>

      <button
        onClick={async () => {
          await signOut();
          navigate('/login');
        }}
        className="w-full rounded-button border border-danger/30 py-3.5 text-sm font-semibold text-danger"
      >
        Log Out
      </button>
    </div>
  );
}
