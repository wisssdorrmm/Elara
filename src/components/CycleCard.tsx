import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { CyclePhase } from '@/types';
import type { ForecastConfidence } from '@/utils/cycle';

interface CycleCardProps {
  daysUntilNextPeriod: number;
  nextPeriodDate: string;
  cycleDay: number;
  phase: CyclePhase;
  isOverdue?: boolean;
  daysOverdue?: number;
  /** Personalized forecast window, e.g. "Aug 26 - Aug 30". Omit to fall back to the plain single-date display. */
  forecastRange?: string;
  forecastConfidence?: ForecastConfidence;
  forecastExplanation?: string;
}

const phaseLabels: Record<CyclePhase, string> = {
  menstrual: 'Menstrual phase',
  follicular: 'Follicular phase',
  ovulation: 'Ovulation phase',
  luteal: 'Luteal phase',
};

const confidenceLabels: Record<ForecastConfidence, string> = {
  high: 'High',
  medium: 'Moderate',
  low: 'Low',
  insufficient: 'Basic estimate',
};

const confidenceTones: Record<ForecastConfidence, 'success' | 'warning' | 'danger' | 'neutral'> = {
  high: 'success',
  medium: 'warning',
  low: 'danger',
  insufficient: 'neutral',
};

export function CycleCard({
  daysUntilNextPeriod,
  nextPeriodDate,
  cycleDay,
  phase,
  isOverdue,
  daysOverdue,
  forecastRange,
  forecastConfidence,
  forecastExplanation,
}: CycleCardProps) {
  // Simple ring progress based on a 28-day average cycle; refined with real data in Part 2.
  const progress = Math.min(cycleDay / 28, 1);
  const circumference = 2 * Math.PI * 40;
  const offset = circumference * (1 - progress);

  const showForecast = !!forecastRange && !!forecastConfidence && forecastConfidence !== 'insufficient';

  return (
    <Card>
      <div className="flex items-center justify-between">
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
          <p className="mt-1 text-sm text-text-muted">Most likely {nextPeriodDate}</p>
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
      </div>

      {showForecast && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Personalized cycle forecast
            </p>
            <Badge tone={confidenceTones[forecastConfidence!]}>{confidenceLabels[forecastConfidence!]}</Badge>
          </div>
          <p className="text-sm font-medium text-text">Expected period: {forecastRange}</p>
          {forecastExplanation && <p className="mt-1 text-xs text-text-muted">{forecastExplanation}</p>}
        </div>
      )}
    </Card>
  );
}
