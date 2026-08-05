import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/utils/toast';
import { Target, Baby, Shield, Sparkles, Waves, Check } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { profileService } from '@/services/profileService';
import { periodService } from '@/services/periodService';
import { cn } from '@/utils/cn';
import { REMINDER_DAY_OPTIONS, formatReminderDayLabel } from '@/constants';
import type { CycleGoal } from '@/types';

const TOTAL_STEPS = 5;

const goals: { value: CycleGoal; label: string; icon: typeof Target }[] = [
  { value: 'track_periods', label: 'Track my periods', icon: Target },
  { value: 'get_pregnant', label: 'Get pregnant', icon: Baby },
  { value: 'avoid_pregnancy', label: 'Avoid pregnancy', icon: Shield },
  { value: 'understand_body', label: 'Understand my body', icon: Sparkles },
  { value: 'manage_irregular_cycles', label: 'Manage irregular cycles', icon: Waves },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  const [goal, setGoal] = useState<CycleGoal | null>(null);
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [lastPeriodStart, setLastPeriodStart] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [periodLength, setPeriodLength] = useState(5);
  const [isRegular, setIsRegular] = useState<'yes' | 'no' | 'not_sure' | null>(null);
  const [reminderDays, setReminderDays] = useState<number[]>([5]);
  const [reminderTime, setReminderTime] = useState('08:00');
  const [saving, setSaving] = useState(false);

  const toggleReminderDay = (day: number) => {
    setReminderDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  };

  const finishOnboarding = async () => {
    if (!user) {
      navigate('/register');
      return;
    }
    setSaving(true);
    try {
      const { error: profileError } = await profileService.updateProfile(user.id, {
        full_name: fullName || null,
        date_of_birth: dateOfBirth || null,
        goal,
        average_cycle_length: cycleLength,
        average_period_length: periodLength,
        cycle_is_regular: isRegular === 'yes' ? true : isRegular === 'no' ? false : null,
        reminder_days_before: reminderDays,
        reminder_time: reminderTime,
        onboarding_completed: true,
      });
      if (profileError) throw new Error(profileError);

      if (lastPeriodStart) {
        const { error: periodError } = await periodService.upsertPeriodForDate(user.id, lastPeriodStart, {});
        if (periodError) throw new Error(periodError);
      }

      notify.success("You're all set!");
      navigate('/dashboard');
    } catch (err) {
      notify.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <Navbar showBack />
      <div className="px-5">
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
          />
        </div>
      </div>

      <div className="app-page pt-0">
        {step === 1 && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-text">What is your goal?</h1>
            <p className="mb-6 text-text-muted">We&apos;ll personalize your experience for you.</p>
            <div className="space-y-3">
              {goals.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setGoal(value)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-card border-2 bg-white px-4 py-4 text-left shadow-card transition-colors',
                    goal === value ? 'border-primary' : 'border-transparent'
                  )}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </span>
                  <span className="flex-1 font-medium text-text">{label}</span>
                  {goal === value && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-text">Tell us about you</h1>
            <p className="mb-6 text-text-muted">This helps us personalize your predictions.</p>
            <div className="space-y-4">
              <Input label="Your name" placeholder="Enter your name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              <Input label="Date of birth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-text">Your last period</h1>
            <p className="mb-6 text-text-muted">When did your last period start?</p>
            <Input label="Start date" type="date" value={lastPeriodStart} onChange={(e) => setLastPeriodStart(e.target.value)} />
          </>
        )}

        {step === 4 && (
          <>
            <h1 className="mb-6 text-2xl font-bold text-text">More about your cycle</h1>
            <div className="space-y-5">
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
                <p className="mb-1.5 text-sm font-medium text-text">Is your cycle regular?</p>
                <div className="grid grid-cols-3 gap-2">
                  {(['yes', 'no', 'not_sure'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setIsRegular(opt)}
                      className={cn(
                        'rounded-button border py-3 text-sm font-medium capitalize',
                        isRegular === opt ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
                      )}
                    >
                      {opt.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {step === 5 && (
          <>
            <h1 className="mb-1 text-2xl font-bold text-text">Reminder preferences</h1>
            <p className="mb-6 text-text-muted">We&apos;ll remind you before important days.</p>
            <p className="mb-2 text-sm font-medium text-text">Remind me before my period</p>
            <div className="mb-5 grid grid-cols-3 gap-2">
              {REMINDER_DAY_OPTIONS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleReminderDay(day)}
                  className={cn(
                    'rounded-button border py-3 text-sm font-medium',
                    reminderDays.includes(day) ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
                  )}
                >
                  {formatReminderDayLabel(day)}
                </button>
              ))}
            </div>
            <Input label="Reminder time" type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} />
          </>
        )}

        <div className="mt-8">
          <Button
            loading={saving}
            disabled={step === 1 && !goal}
            onClick={() => (step < TOTAL_STEPS ? setStep((s) => s + 1) : finishOnboarding())}
          >
            {step < TOTAL_STEPS ? 'Next' : 'Complete Setup'}
          </Button>
        </div>
      </div>
    </div>
  );
}
