import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets } from 'lucide-react';
import { notify } from '@/utils/toast';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { periodService } from '@/services/periodService';
import { cn } from '@/utils/cn';
import type { FlowIntensity } from '@/types';

const flowOptions: { value: FlowIntensity; label: string; drops: number }[] = [
  { value: 'light', label: 'Light', drops: 1 },
  { value: 'medium', label: 'Medium', drops: 2 },
  { value: 'heavy', label: 'Heavy', drops: 3 },
  { value: 'very_heavy', label: 'Very heavy', drops: 4 },
];

export default function LogFlow() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [flow, setFlow] = useState<FlowIntensity | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !flow) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await periodService.upsertPeriodForDate(user.id, today, { flow });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Flow logged');
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar title="Flow" showBack />
      <div className="app-page pt-0">
        <p className="mb-6 text-text-muted">How heavy is your flow?</p>
        <div className="space-y-3">
          {flowOptions.map(({ value, label, drops }) => (
            <button
              key={value}
              onClick={() => setFlow(value)}
              className={cn(
                'flex w-full items-center gap-3 rounded-card border-2 bg-white px-4 py-4 text-left shadow-card',
                flow === value ? 'border-danger bg-danger/5' : 'border-transparent'
              )}
            >
              <span className="flex gap-0.5">
                {Array.from({ length: drops }).map((_, i) => (
                  <Droplets key={i} className="h-4 w-4 text-danger" />
                ))}
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
