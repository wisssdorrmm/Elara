import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { notify } from '@/utils/toast';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { useActivePeriod } from '@/hooks/useActivePeriod';
import { logService } from '@/services/logService';
import { cn } from '@/utils/cn';
import { FLOW_OPTIONS } from '@/constants';
import type { FlowIntensity } from '@/types';

const today = new Date().toISOString().slice(0, 10);

export default function LogFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activePeriod, loading: periodLoading } = useActivePeriod();
  const [flow, setFlow] = useState<FlowIntensity | null>(null);
  const [saving, setSaving] = useState(false);

  // Prefill from today's existing log, if flow was already logged today.
  useEffect(() => {
    if (!user) return;
    logService.getLogByDate(user.id, today).then(({ data }) => {
      if (data?.flow) setFlow(data.flow);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user || !flow) return;
    setSaving(true);
    // Flow only ever updates today's log - it never touches periods.
    const { error } = await logService.upsertLog(user.id, today, { flow });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Flow logged');
    navigate('/dashboard');
  };

  if (periodLoading) return <Loading fullScreen />;

  if (!activePeriod) {
    return (
      <div>
        <Navbar title="Flow" showBack />
        <div className="app-page pt-0 text-center">
          <p className="mb-2 font-semibold text-text">No active period</p>
          <p className="mb-6 text-text-muted">Start a period first, then log your flow each day.</p>
          <Button onClick={() => navigate('/log/period')}>Go to Period</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar title="Flow" showBack />
      <div className="app-page pt-0">
        <p className="mb-6 text-text-muted">How heavy is your flow today?</p>
        <div className="space-y-3">
          {FLOW_OPTIONS.map(({ value, label, drops }) => (
            <button
              key={value}
              onClick={() => setFlow(value)}
              className={cn(
                'flex w-full items-center gap-3 rounded-card border-2 bg-white px-4 py-4 text-left shadow-card',
                flow === value ? 'border-danger bg-danger/5' : 'border-transparent'
              )}
            >
              <span className="flex w-16 gap-0.5">
                {drops === 0 ? (
                  <span className="h-2 w-2 rounded-full border border-danger" />
                ) : (
                  Array.from({ length: drops }).map((_, i) => <Droplets key={i} className="h-4 w-4 text-danger" />)
                )}
              </span>
              <span className="font-medium text-text">{label}</span>
            </button>
          ))}
        </div>
        <div className="mt-8">
          <Button disabled={!flow} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
