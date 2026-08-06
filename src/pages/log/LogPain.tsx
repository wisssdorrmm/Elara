import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { logService } from '@/services/logService';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';
import { PAIN_SCALE, formatPainLabel } from '@/constants';

const today = new Date().toISOString().slice(0, 10);

export default function LogPain() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [level, setLevel] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    logService.getLogByDate(user.id, today).then(({ data }) => {
      if (data?.pain_level != null) setLevel(data.pain_level);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user || level === null) return;
    setSaving(true);
    const { error } = await logService.upsertLog(user.id, today, { pain_level: level });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Pain logged');
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar title="Pain" showBack />
      <div className="app-page pt-0">
        <p className="mb-2 text-text-muted">How much pain are you in today?</p>
        {level !== null && <p className="mb-6 text-3xl font-bold text-text">{level}/10</p>}

        <div className="mb-2 grid grid-cols-6 gap-2 sm:grid-cols-11">
          {PAIN_SCALE.map((n) => (
            <button
              key={n}
              onClick={() => setLevel(n)}
              className={cn(
                'flex h-11 items-center justify-center rounded-full border text-sm font-semibold',
                level === n ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
              )}
            >
              {n}
            </button>
          ))}
        </div>
        {level !== null && <p className="mb-8 text-sm text-text-muted">{formatPainLabel(level)}</p>}

        <div className="mt-8">
          <Button disabled={level === null} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
