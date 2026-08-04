import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/utils/toast';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { cn } from '@/utils/cn';

const symptomOptions = [
  'Cramps',
  'Headache',
  'Back pain',
  'Bloating',
  'Fatigue',
  'Acne',
  'Tender breasts',
  'Nausea',
  'Constipation',
  'Diarrhea',
  'Food cravings',
];

export default function LogSymptoms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const toggle = (symptom: string) => {
    setSelected((prev) => (prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('logs').upsert({
      user_id: user.id,
      log_date: today,
      symptoms: selected,
      notes: note || null,
    });
    setSaving(false);
    if (error) {
      notify.error(error.message);
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
          {symptomOptions.map((symptom) => (
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
