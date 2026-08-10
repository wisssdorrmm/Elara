import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';
import { CHECKIN_FEELING_OPTIONS } from '@/constants';
import type { CheckinFeeling } from '@/types';

export default function DailyCheckin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { relationship } = useRelationship();
  const [feeling, setFeeling] = useState<CheckinFeeling | null>(null);
  const [note, setNote] = useState('');
  const [isShared, setIsShared] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !relationship || !feeling) return;
    setSaving(true);
    const { error } = await coupleEngagementService.submitCheckin(relationship.id, user.id, feeling, note || null, isShared);
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Check-in saved');
    navigate('/couple');
  };

  return (
    <div>
      <Navbar title="Daily Check-in" showBack />
      <div className="app-page pt-0">
        <p className="mb-6 text-text-muted">How did your partner make you feel today?</p>

        <div className="mb-6 grid grid-cols-4 gap-3">
          {CHECKIN_FEELING_OPTIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setFeeling(value)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-card border-2 bg-white py-3 shadow-card',
                feeling === value ? 'border-primary' : 'border-transparent'
              )}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[11px] font-medium text-text">{label}</span>
            </button>
          ))}
        </div>

        <label className="mb-1.5 block text-sm font-medium text-text">Add a note (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write something..."
          rows={3}
          className="mb-4 w-full rounded-input border border-gray-200 bg-white px-4 py-3.5 text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />

        <label className="mb-6 flex cursor-pointer items-center justify-between rounded-card bg-white px-4 py-3.5 shadow-card">
          <div>
            <p className="text-sm font-medium text-text">Share with partner</p>
            <p className="text-xs text-text-muted">Off by default — your check-in stays private unless you share it.</p>
          </div>
          <button
            role="switch"
            aria-checked={isShared}
            onClick={() => setIsShared((s) => !s)}
            className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', isShared ? 'bg-primary' : 'bg-gray-200')}
          >
            <span
              className={cn(
                'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                isShared ? 'translate-x-[22px]' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>

        <Button disabled={!feeling} loading={saving} onClick={handleSave}>
          Save Check-in
        </Button>
      </div>
    </div>
  );
}
