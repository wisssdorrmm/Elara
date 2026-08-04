import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Droplet, Activity, Smile } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { CycleCard } from '@/components/CycleCard';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePeriods } from '@/hooks/usePeriods';
import { useLogs } from '@/hooks/useLogs';
import { computeCycleStats } from '@/utils/cycle';

const quickActions = [
  { label: 'Log Period', icon: Droplet, path: '/log/flow' },
  { label: 'Log Symptoms', icon: Activity, path: '/log/symptoms' },
  { label: 'Log Mood', icon: Smile, path: '/log/mood' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { periods, loading: periodsLoading, error: periodsError, refetch: refetchPeriods } = usePeriods();

  const today = format(new Date(), 'yyyy-MM-dd');
  const { logs, loading: logsLoading } = useLogs(today, today);
  const todayLog = logs[0];

  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';
  const loading = profileLoading || periodsLoading;
  const error = profileError || periodsError;

  if (loading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-text">Hello, {firstName} 👋</h1>
          <p className="text-sm text-text-muted">Today, {format(new Date(), 'MMM d')}</p>
        </div>
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="We couldn't load your dashboard."
        onRetry={() => {
          refetchProfile();
          refetchPeriods();
        }}
      />
    );
  }

  const stats = computeCycleStats(periods, profile?.average_cycle_length ?? 28, profile?.average_period_length ?? 5);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">Hello, {firstName} 👋</h1>
        <p className="text-sm text-text-muted">Today, {format(new Date(), 'MMM d')}</p>
      </div>

      {stats.cycleDay && stats.nextPeriodDate ? (
        <CycleCard
          daysUntilNextPeriod={stats.isOverdue ? 0 : stats.daysUntilNextPeriod ?? 0}
          nextPeriodDate={format(stats.nextPeriodDate, 'MMM d, yyyy')}
          cycleDay={stats.cycleDay}
          phase={stats.phase ?? 'follicular'}
        />
      ) : (
        <Card>
          <p className="mb-1 font-semibold text-text">No period logged yet</p>
          <p className="text-sm text-text-muted">Log your last period to see predictions and cycle insights.</p>
        </Card>
      )}

      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-2 rounded-card bg-white px-2 py-4 shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </span>
            <span className="text-center text-xs font-medium text-text">{label}</span>
          </button>
        ))}
      </div>

      <Card>
        <p className="mb-3 font-semibold text-text">Today&apos;s summary</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-text-muted">
            <Activity className="h-4 w-4" />
            {!logsLoading && todayLog?.symptoms?.length
              ? `${todayLog.symptoms.length} symptom${todayLog.symptoms.length > 1 ? 's' : ''} logged`
              : 'No symptoms logged yet'}
          </div>
          <button onClick={() => navigate('/log/symptoms')} className="text-primary">
            {todayLog?.symptoms?.length ? 'Edit' : 'Tap to add'}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          <Smile className="h-4 w-4" />
          {!logsLoading && todayLog?.mood ? `Mood: ${todayLog.mood}` : 'Mood not logged yet'}
        </div>
      </Card>
    </div>
  );
}
