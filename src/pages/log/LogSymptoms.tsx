import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/utils/toast';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { logService } from '@/services/logService';
import { cn } from '@/utils/cn';
import { SYMPTOM_OPTIONS } from '@/constants';

const today = new Date().toISOString().slice(0, 10);

export default function LogSymptoms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Prefill from today's existing log, if one exists, so re-opening this
  // screen edits the record instead of silently overwriting it.
  useEffect(() => {
    if (!user) return;
    logService.getLogByDate(user.id, today).then(({ data }) => {
      if (data) {
        setSelected(data.symptoms ?? []);
        setNote(data.notes ?? '');
      }
    });
  }, [user]);

  const toggle = (symptom: string) => {
    setSelected((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await logService.upsertLog(user.id, today, {
      symptoms: selected,
      notes: note || null,
    });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Symptoms logged');
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar title="Symptoms" showBack />
      <div className="app-page pt-0">
        <p className="mb-4 text-text-muted">Select all that apply</p>
        <div className="mb-6 flex flex-wrap gap-2">
          {SYMPTOM_OPTIONS.map((symptom) => (
            <button
              key={symptom}
              onClick={() => toggle(symptom)}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                selected.includes(symptom) ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
              )}
            >
              {symptom}
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
          <Button loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
