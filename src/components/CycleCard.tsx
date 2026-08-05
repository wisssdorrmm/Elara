import { Card } from '@/components/ui/Card';
import type { CyclePhase } from '@/types';

interface CycleCardProps {
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  cycleDay: number;
  phase: CyclePhase;
  isOverdue?: boolean;
  daysOverdue?: number;
}

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: 'Menstrual phase',
  follicular: 'Follicular phase',
  ovulation: 'Ovulation phase',
  luteal: 'Luteal phase',
};

export function CycleCard({ daysUntilNextPeriod, nextPeriodDate, cycleDay, phase, isOverdue, daysOverdue }: CycleCardProps) {
  // Simple ring progress based on a 28-day average cycle; refined with real data in Part 2.
  const progress = Math.min(cycleDay / 28, 1);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - progress);

  return (
    <Card className="flex items-center justify-between">
      <div>
        {isOverdue && daysOverdue ? (
          <>
            <p className="text-sm text-danger">Period may be late</p>
            <p className="text-3xl font-bold text-text">{daysOverdue}d late</p>
          </>
        ) : (
          <>
            <p className="text-sm text-text-muted">Next period in</p>
            <p className="text-3xl font-bold text-text">{daysUntilNextPeriod} days</p>
          </>
        )}
        <p className="mt-1 text-sm text-text-muted">{nextPeriodDate}</p>
        <p className="mt-3 text-sm font-medium text-text">
          Cycle day <span className="text-primary">{cycleDay}</span>
        </p>
        <p className="text-sm text-text-muted">{phaseLabels[phase]}</p>
      </div>
      <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
        <circle cx="48" cy="48" r="40" stroke="#F3E8FF" strokeWidth="8" fill="none" />
        <circle
          cx="48"
          cy="48"
          r="40"
          stroke="#7C3AED"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
    </Card>
  );
}
