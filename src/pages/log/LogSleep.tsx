import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { logService } from '@/services/logService';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';

const today = new Date().toISOString().slice(0, 10);
const HOUR_OPTIONS = Array.from({ length: 29 }, (_, i) => i * 0.5); // 0 to 14 in 0.5 steps

export default function LogSleep() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hours, setHours] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    logService.getLogByDate(user.id, today).then(({ data }) => {
      if (data?.sleep_hours != null) setHours(data.sleep_hours);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user || hours === null) return;
    setSaving(true);
    const { error } = await logService.upsertLog(user.id, today, { sleep_hours: hours });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Sleep logged');
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar title="Sleep" showBack />
      <div className="app-page pt-0">
        <p className="mb-6 text-text-muted">How many hours did you sleep last night?</p>

        <div className="mb-6 flex flex-col items-center">
          <span className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Moon className="h-6 w-6 text-primary" />
          </span>
          <p className="text-3xl font-bold text-text">{hours !== null ? `${hours}h` : '—'}</p>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {HOUR_OPTIONS.map((h) => (
            <button
              key={h}
              onClick={() => setHours(h)}
              className={cn(
                'flex h-10 items-center justify-center rounded-full border text-xs font-medium',
                hours === h ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
              )}
            >
              {h}
            </button>
          ))}
        </div>

        <div className="mt-8">
          <Button disabled={hours === null} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
