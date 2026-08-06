import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { logService } from '@/services/logService';
import { notify } from '@/utils/toast';

const today = new Date().toISOString().slice(0, 10);

export default function LogNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    logService.getLogByDate(user.id, today).then(({ data }) => {
      if (data?.notes) setNote(data.notes);
    });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await logService.upsertLog(user.id, today, { notes: note || null });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Note saved');
    navigate('/dashboard');
  };

  return (
    <div>
      <Navbar title="Notes" showBack />
      <div className="app-page pt-0">
        <p className="mb-4 text-text-muted">Anything you want to remember about today?</p>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something..."
          rows={8}
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
