import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Play, Square, Pencil } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dialog } from '@/components/ui/Dialog';
import { useAuth } from '@/hooks/useAuth';
import { useActivePeriod } from '@/hooks/useActivePeriod';
import { periodService } from '@/services/periodService';
import { notify } from '@/utils/toast';

export default function LogPeriod() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePeriod, loading, error, refetch } = useActivePeriod();
  const [starting, setStarting] = useState(false);
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [ending, setEnding] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const handleStart = async () => {
    if (!user) return;
    setStarting(true);
    const { error: startError } = await periodService.startPeriod(user.id, today);
    setStarting(false);
    if (startError) {
      notify.error(startError);
      return;
    }
    notify.success('Period started');
    refetch();
  };

  const handleEnd = async () => {
    if (!activePeriod) return;
    setEnding(true);
    const { data, error: endError } = await periodService.endPeriod(activePeriod.id, today);
    setEnding(false);
    setEndConfirmOpen(false);
    if (endError || !data) {
      notify.error(endError ?? 'Something went wrong ending your period');
      return;
    }
    notify.success('Period ended');
    // Automatically generate and show the end-of-period report.
    navigate(`/history/${data.id}/report`);
  };

  if (loading) return <Loading fullScreen />;
  if (error) return <ErrorState message="We couldn't load your period status." onRetry={refetch} />;

  return (
    <div>
      <Navbar title="Period" showBack />
      <div className="app-page pt-0">
        {activePeriod ? (
          <Card className="mb-4">
            <p className="text-sm text-text-muted">Period active since</p>
            <p className="text-2xl font-bold text-text">{format(new Date(activePeriod.start_date), 'MMM d, yyyy')}</p>
          </Card>
        ) : (
          <Card className="mb-4">
            <p className="font-semibold text-text">No active period</p>
            <p className="text-sm text-text-muted">Start one when your period begins.</p>
          </Card>
        )}

        <div className="space-y-3">
          {!activePeriod && (
            <Button loading={starting} onClick={handleStart} icon={<Play className="h-4 w-4" />}>
              Start Period
            </Button>
          )}

          {activePeriod && (
            <>
              <Button variant="danger" onClick={() => setEndConfirmOpen(true)} icon={<Square className="h-4 w-4" />}>
                End Period
              </Button>
              <Button
                variant="outline"
                icon={<Pencil className="h-4 w-4" />}
                onClick={() => navigate(`/history/${activePeriod.id}/edit`)}
              >
                Edit Current Period
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog
        open={endConfirmOpen}
        onClose={() => setEndConfirmOpen(false)}
        onConfirm={handleEnd}
        title="End your period?"
        description="This sets today as your period's end date and generates your cycle summary report."
        confirmLabel="End Period"
        loading={ending}
      />
    </div>
  );
}
