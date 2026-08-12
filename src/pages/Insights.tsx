import { format } from 'date-fns';
import { Sparkles, Activity, Smile, Droplets, Moon, Zap } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useProfile } from '@/hooks/useProfile';
import { usePeriods } from '@/hooks/usePeriods';
import { useLogs } from '@/hooks/useLogs';
import { computeCycleStats, phaseInfo } from '@/utils/cycle';
import { computeInsightsSummary, generatePersonalInsights } from '@/utils/insights';

export default function Insights() {
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { periods, loading: periodsLoading, error: periodsError, refetch: refetchPeriods } = usePeriods();

  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const { logs, loading: logsLoading, error: logsError, refetch: refetchLogs } = useLogs(
    format(ninetyDaysAgo, 'yyyy-MM-dd'),
    format(new Date(), 'yyyy-MM-dd')
  );

  const loading = profileLoading || periodsLoading || logsLoading;
  const error = profileError || periodsError || logsError;

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-text">Insights</h1>
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        message="We couldn't load your insights."
        onRetry={() => {
          refetchProfile();
          refetchPeriods();
          refetchLogs();
        }}
      />
    );
  }

  const cycleLength = profile?.average_cycle_length ?? 28;
  const periodLength = profile?.average_period_length ?? 5;
  const stats = computeCycleStats(periods, cycleLength, periodLength);
  const summary = computeInsightsSummary(logs);
  const personalInsights = generatePersonalInsights(summary, profile?.cycle_is_regular ?? null);

  const last7 = logs.filter((l) => new Date(l.log_date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const last30 = logs.filter((l) => new Date(l.log_date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text">Insights</h1>

      {stats.phase ? (
        <Card style={{ borderLeft: `4px solid ${phaseInfo[stats.phase].color}` }}>
          <p className="text-sm text-text-muted">Current phase</p>
          <p className="text-lg font-bold text-text">{phaseInfo[stats.phase].label}</p>
          <p className="mt-1 text-sm text-text-muted">{phaseInfo[stats.phase].description}</p>
        </Card>
      ) : (
        <EmptyState icon={Sparkles} title="No cycle data yet" description="Log your last period to unlock cycle insights." />
      )}

      {stats.cycleDay && (
        <Card>
          <p className="mb-3 font-semibold text-text">Cycle Overview</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-text-muted">Cycle day</p>
              <p className="font-semibold text-text">Day {stats.cycleDay}</p>
            </div>
            <div>
              <p className="text-text-muted">Average cycle length</p>
              <p className="font-semibold text-text">{cycleLength} days</p>
            </div>
            <div>
              <p className="text-text-muted">Average period length</p>
              <p className="font-semibold text-text">{periodLength} days</p>
            </div>
            <div>
              <p className="text-text-muted">Regularity</p>
              <p className="font-semibold text-text">
                {profile?.cycle_is_regular === true ? 'Regular' : profile?.cycle_is_regular === false ? 'Irregular' : 'Not set'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {stats.nextPeriodDate && (
        <Card>
          <p className="mb-3 font-semibold text-text">Predictions</p>
          <div className="space-y-2.5 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Next period</span>
              <span className="font-medium text-text">{format(stats.nextPeriodDate, 'MMM d, yyyy')}</span>
            </div>
            {stats.ovulationDate && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Estimated ovulation</span>
                <span className="font-medium text-text">{format(stats.ovulationDate, 'MMM d')}</span>
              </div>
            )}
            {stats.fertileWindowStart && stats.fertileWindowEnd && (
              <div className="flex items-center justify-between">
                <span className="text-text-muted">Fertile window</span>
                <span className="font-medium text-text">
                  {format(stats.fertileWindowStart, 'MMM d')} - {format(stats.fertileWindowEnd, 'MMM d')}
                </span>
              </div>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-3 flex items-center gap-2 text-text">
          <Activity className="h-4 w-4 text-warning" />
          <p className="font-semibold">Symptom Patterns</p>
        </div>
        {summary.topSymptoms.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {summary.topSymptoms.map(({ label, count }) => (
              <Badge key={label} tone="warning">
                {label} · {count}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No symptoms logged in the last 90 days.</p>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center gap-2 text-text">
          <Smile className="h-4 w-4 text-primary" />
          <p className="font-semibold">Mood Patterns</p>
        </div>
        {summary.moodFrequency.length > 0 ? (
          <div className="space-y-1.5">
            {summary.moodFrequency.slice(0, 5).map(({ label, count }) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="text-text">{label}</span>
                <span className="text-text-muted">{count} days</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted">No moods logged in the last 90 days.</p>
        )}
      </Card>

      {personalInsights.length > 0 && (
        <Card>
          <div className="mb-3 flex items-center gap-2 text-text">
            <Sparkles className="h-4 w-4 text-primary" />
            <p className="font-semibold">Personal Insights</p>
          </div>
          <ul className="space-y-2">
            {personalInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {insight}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <p className="mb-3 font-semibold text-text">This Week vs This Month</p>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-text-muted">Logged this week</p>
            <p className="font-semibold text-text">{last7.length} entries</p>
          </div>
          <div>
            <p className="text-text-muted">Logged this month</p>
            <p className="font-semibold text-text">{last30.length} entries</p>
          </div>
          {summary.averagePainLevel !== null && (
            <div>
              <p className="flex items-center gap-1 text-text-muted">
                <Zap className="h-3.5 w-3.5" /> Avg pain (90d)
              </p>
              <p className="font-semibold text-text">{summary.averagePainLevel.toFixed(1)}/10</p>
            </div>
          )}
          {summary.averageSleepHours !== null && (
            <div>
              <p className="flex items-center gap-1 text-text-muted">
                <Moon className="h-3.5 w-3.5" /> Avg sleep (90d)
              </p>
              <p className="font-semibold text-text">{summary.averageSleepHours.toFixed(1)}h</p>
            </div>
          )}
        </div>
      </Card>

      {logs.length === 0 && (
        <EmptyState
          icon={Droplets}
          title="Start logging to unlock deeper insights"
          description="Symptom, mood, pain, and sleep patterns will appear here once you've logged a few entries."
        />
      )}
    </div>
  );
}
