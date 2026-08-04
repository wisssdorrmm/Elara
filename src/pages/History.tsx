import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { usePeriods } from '@/hooks/usePeriods';

export default function History() {
  const navigate = useNavigate();
  const { periods, loading, error, refetch } = usePeriods();

  if (loading) return <SkeletonList count={4} />;
  if (error) return <ErrorState message="We couldn't load your history." onRetry={refetch} />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">History</h1>

      {periods.length === 0 ? (
        <EmptyState icon={Clock} title="No cycles logged yet" description="Your past cycles will show up here once you start tracking." />
      ) : (
        <div className="space-y-3">
          {periods.map((period, i) => {
            const nextOlder = periods[i + 1];
            const cycleLength = nextOlder
              ? differenceInCalendarDays(new Date(period.start_date), new Date(nextOlder.start_date))
              : null;
            const periodLength = period.end_date
              ? differenceInCalendarDays(new Date(period.end_date), new Date(period.start_date)) + 1
              : null;

            return (
              <Card key={period.id} interactive onClick={() => navigate(`/history/${period.id}`)} role="button">
                <p className="font-semibold text-text">{format(new Date(period.start_date), 'MMMM yyyy')}</p>
                <p className="text-sm text-text-muted">
                  Started {format(new Date(period.start_date), 'MMM d')}
                  {period.end_date && ` – ${format(new Date(period.end_date), 'MMM d')}`}
                  {periodLength && ` · ${periodLength} day period`}
                  {cycleLength && ` · ${cycleLength} day cycle`}
                </p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
