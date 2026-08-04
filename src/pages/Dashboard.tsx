import { useNavigate } from 'react-router-dom';
import { Droplet, Activity, Smile } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { CycleCard } from '@/components/CycleCard';
import { useAuth } from '@/hooks/useAuth';

const quickActions = [
  { label: 'Log Period', icon: Droplet, path: '/log/flow' },
  { label: 'Log Symptoms', icon: Activity, path: '/log/symptoms' },
  { label: 'Log Mood', icon: Smile, path: '/log/mood' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const firstName = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-text">Hello, {firstName} 👋</h1>
        <p className="text-sm text-text-muted">Today, {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
      </div>

      <CycleCard daysUntilNextPeriod={8} nextPeriodDate="May 2, 2024" cycleDay={12} phase="follicular" />

      <div className="grid grid-cols-3 gap-3">
        {quickActions.map(({ label, icon: Icon, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center gap-2 rounded-card bg-white px-2 py-4 shadow-card"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </span>
            <span className="text-center text-xs font-medium text-text">{label}</span>
          </button>
        ))}
      </div>

      <Card>
        <p className="mb-3 font-semibold text-text">Today&apos;s summary</p>
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-text-muted">
            <Activity className="h-4 w-4" />
            No symptoms logged yet
          </div>
          <span className="text-primary">Tap to add</span>
        </div>
        <div className="mt-3 flex items-center gap-2 text-sm text-text-muted">
          <Smile className="h-4 w-4" />
          Mood: Happy
        </div>
      </Card>
    </div>
  );
}
