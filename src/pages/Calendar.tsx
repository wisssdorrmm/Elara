import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Droplets, Smile, Activity, FileText, Plus } from 'lucide-react';
import { CalendarCard } from '@/components/CalendarCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { usePeriods } from '@/hooks/usePeriods';
import { logService } from '@/services/logService';
import { computeCycleStats, getDayState } from '@/utils/cycle';
import type { Database } from '@/types';

type Log = Database['public']['Tables']['logs']['Row'];

export default function CalendarPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { periods, loading: periodsLoading, error: periodsError, refetch: refetchPeriods } = usePeriods();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedLog, setSelectedLog] = useState<Log | null>(null);
  const [logLoading, setLogLoading] = useState(false);

  const loading = profileLoading || periodsLoading;
  const error = profileError || periodsError;

  useEffect(() => {
    if (!user) return;
    setLogLoading(true);
    logService.getLogByDate(user.id, format(selectedDate, 'yyyy-MM-dd')).then(({ data }) => {
      setSelectedLog(data);
      setLogLoading(false);
    });
  }, [user, selectedDate]);

  if (loading) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-text">Calendar</h1>
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="We couldn't load your calendar."
        onRetry={() => {
          refetchProfile();
          refetchPeriods();
        }}
      />
    );
  }

  const stats = computeCycleStats(periods, profile?.average_cycle_length ?? 28, profile?.average_period_length ?? 5);
  const selectedPeriod = periods.find((p) => p.start_date === format(selectedDate, 'yyyy-MM-dd'));

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">Calendar</h1>
      <CalendarCard
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        getDayState={(date) => {
          const state = getDayState(date, periods, stats);
          return state === 'none' ? 'none' : state;
        }}
      />

      <div className="flex flex-wrap gap-4 text-xs text-text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger" /> Period
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/20" /> Predicted
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-primary/20" /> Ovulation
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent/30" /> Fertile window
        </span>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-semibold text-text">{format(selectedDate, 'EEEE, MMM d')}</p>
          {selectedPeriod?.flow && <Badge tone="danger">{selectedPeriod.flow.replace('_', ' ')} flow</Badge>}
        </div>

        {logLoading ? (
          <p className="text-sm text-text-muted">Loading...</p>
        ) : selectedLog || selectedPeriod ? (
          <div className="space-y-2 text-sm">
            {selectedLog?.mood && (
              <div className="flex items-center gap-2 text-text-muted">
                <Smile className="h-4 w-4" /> Mood: {selectedLog.mood}
              </div>
            )}
            {!!selectedLog?.symptoms?.length && (
              <div className="flex items-start gap-2 text-text-muted">
                <Activity className="h-4 w-4 shrink-0 mt-0.5" /> {selectedLog.symptoms.join(', ')}
              </div>
            )}
            {selectedLog?.notes && (
              <div className="flex items-start gap-2 text-text-muted">
                <FileText className="h-4 w-4 shrink-0 mt-0.5" /> {selectedLog.notes}
              </div>
            )}
            {selectedPeriod?.flow && !selectedLog && (
              <div className="flex items-center gap-2 text-text-muted">
                <Droplets className="h-4 w-4" /> Flow: {selectedPeriod.flow.replace('_', ' ')}
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-text-muted">Nothing logged for this day yet.</p>
        )}

        <button
          onClick={() => navigate('/log/symptoms')}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary"
        >
          <Plus className="h-4 w-4" /> {selectedLog ? 'Edit log' : 'Log this day'}
        </button>
      </Card>
    </div>
  );
}
