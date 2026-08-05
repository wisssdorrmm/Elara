import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/utils/toast';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { logService } from '@/services/logService';
import { cn } from '@/utils/cn';
import { MOOD_OPTIONS } from '@/constants';

const today = new Date().toISOString().slice(0, 10);

export default function LogMood() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mood, setMood] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    logService.getLogByDate(user.id, today).then(({ data }) => {
      if (data) {
        setMood(data.mood ?? null);
        setNote(data.notes ?? '');
      }
    });
  }, [user]);

  const handleSave = async () => {
    if (!user || !mood) return;
    setSaving(true);
    const { error } = await logService.upsertLog(user.id, today, { mood, notes: note || null });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Mood logged');
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar title="Mood" showBack />
      <div className="app-page pt-0">
        <p className="mb-6 text-text-muted">How are you feeling?</p>
        <div className="mb-6 grid grid-cols-3 gap-3">
          {MOOD_OPTIONS.map(({ label, emoji }) => (
            <button
              key={label}
              onClick={() => setMood(label)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-card border-2 bg-white py-4 shadow-card',
                mood === label ? 'border-primary' : 'border-transparent'
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-medium text-text">{label}</span>
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-medium text-text">Add note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something..."
          rows={3}
          className="w-full rounded-input border border-gray-200 bg-white px-4 py-3.5 text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <div className="mt-8">
          <Button disabled={!mood} loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
