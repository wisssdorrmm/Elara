import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { useProfile } from '@/hooks/useProfile';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';

const reminderOptions = [10, 7, 5, 3, 1, 0];

export default function EditProfile() {
  const navigate = useNavigate();
  const { profile, loading, error, refetch, updateProfile } = useProfile();

  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [reminderDays, setReminderDays] = useState<number[]>([5]);
  const [reminderTime, setReminderTime] = useState('08:00');

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.full_name ?? '');
    setCycleLength(profile.average_cycle_length);
    setPeriodLength(profile.average_period_length);
    setReminderDays(profile.reminder_days_before ?? [5]);
    setReminderTime(profile.reminder_time?.slice(0, 5) ?? '08:00');
  }, [profile]);

  const toggleReminderDay = (day: number) => {
    setReminderDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const handleSave = async () => {
    setSaving(true);
    const { error: saveError } = await updateProfile({
      full_name: fullName,
      average_cycle_length: cycleLength,
      average_period_length: periodLength,
      reminder_days_before: reminderDays,
      reminder_time: reminderTime,
    });
    setSaving(false);
    if (saveError) {
      notify.error(saveError);
      return;
    }
    notify.success('Profile updated');
    navigate('/profile');
  };

  if (loading) return <Loading fullScreen />;
  if (error) return <ErrorState message="We couldn't load your profile." onRetry={refetch} />;

  return (
    <div>
      <Navbar showBack title="Edit Profile" />
      <div className="app-page space-y-5 pt-0">
        <Input label="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Average cycle length</label>
          <select
            value={cycleLength}
            onChange={(e) => setCycleLength(Number(e.target.value))}
            className="w-full rounded-input border border-gray-200 bg-white px-4 py-3.5"
          >
            {Array.from({ length: 21 }, (_, i) => i + 21).map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Average period length</label>
          <select
            value={periodLength}
            onChange={(e) => setPeriodLength(Number(e.target.value))}
            className="w-full rounded-input border border-gray-200 bg-white px-4 py-3.5"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text">Remind me before my period</p>
          <div className="grid grid-cols-3 gap-2">
            {reminderOptions.map((day) => (
              <button
                key={day}
                onClick={() => toggleReminderDay(day)}
                className={cn(
                  'rounded-button border py-3 text-sm font-medium',
                  reminderDays.includes(day) ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
                )}
              >
                {day === 0 ? 'On the day' : `${day} day${day > 1 ? 's' : ''} before`}
              </button>
            ))}
          </div>
        </div>

        <Input label="Reminder time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />

        <Button loading={saving} onClick={handleSave}>
          Save
        </Button>
        <Button variant="outline" onClick={() => navigate('/profile')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
