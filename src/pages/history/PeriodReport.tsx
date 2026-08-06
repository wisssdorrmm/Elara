import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import {
  Droplets,
  Smile,
  Activity,
  Zap,
  Moon,
  FileText,
  Sparkles,
  BarChart3,
  PartyPopper,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { periodService } from '@/services/periodService';
import { logService } from '@/services/logService';
import { generatePeriodReport, type PeriodReport as PeriodReportData, type Trend } from '@/utils/periodReport';
import { FLOW_LABELS } from '@/constants';
import type { Database } from '@/types';

type Period = Database['public']['Tables']['periods']['Row'];

const sectionVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.35, delay: i * 0.06 } }),
};

function TrendIcon({ trend }: { trend: Trend | null }) {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-success" />;
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-danger" />;
  return <Minus className="h-4 w-4 text-text-muted" />;
}

export default function PeriodReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();

  const [period, setPeriod] = useState<Period | null>(null);
  const [report, setReport] = useState<PeriodReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    setError(null);

    const { data: periodData, error: periodError } = await periodService.getPeriodById(id, user.id);
    if (periodError) {
      setError(periodError);
      setLoading(false);
      return;
    }
    if (!periodData) {
      setError("This cycle report couldn't be found.");
      setLoading(false);
      return;
    }
    setPeriod(periodData);

    const { data: logsData, error: logsError } = await logService.getLogsInRange(
      user.id,
      periodData.start_date,
      periodData.end_date ?? periodData.start_date
    );
    if (logsError) {
      setError(logsError);
      setLoading(false);
      return;
    }

    // Find the period immediately before this one, for the comparison section.
    const { data: allPeriods, error: allPeriodsError } = await periodService.getPeriods(user.id);
    if (allPeriodsError) {
      setError(allPeriodsError);
      setLoading(false);
      return;
    }
    const previousPeriod =
      allPeriods
        ?.filter((p) => p.id !== periodData.id && p.start_date < periodData.start_date)
        .sort((a, b) => (a.start_date < b.start_date ? 1 : -1))[0] ?? null;

    let previousLogs: Database['public']['Tables']['logs']['Row'][] = [];
    if (previousPeriod) {
      const { data: prevLogsData } = await logService.getLogsInRange(
        user.id,
        previousPeriod.start_date,
        previousPeriod.end_date ?? previousPeriod.start_date
      );
      previousLogs = prevLogsData ?? [];
    }

    const generated = generatePeriodReport(
      periodData,
      logsData ?? [],
      previousPeriod,
      previousLogs,
      profile?.average_cycle_length ?? 28
    );
    setReport(generated);
    setLoading(false);
  }, [user, id, profile?.average_cycle_length]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <Loading fullScreen label="Building your cycle report..." />;
  if (error || !period || !report) {
    return <ErrorState message={error ?? "We couldn't build this report."} onRetry={load} />;
  }

  const { cycleSummary, flowTimeline, moodSummary, symptomsSummary, painSummary, sleepSummary, notesSummary, insights, comparison } =
    report;

  let sectionIndex = 0;
  const nextIndex = () => sectionIndex++;

  return (
    <div>
      <Navbar title="Cycle Report" showBack />
      <div className="app-page space-y-4 pt-0">
        {/* Cycle Summary */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card className="bg-gradient-to-br from-primary to-secondary text-white">
            <p className="text-sm text-white/80">Cycle</p>
            <p className="text-xl font-bold">
              {format(new Date(cycleSummary.startDate), 'MMM d')} – {format(new Date(cycleSummary.endDate), 'MMM d')}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-white/70">Duration</p>
                <p className="text-lg font-semibold">{cycleSummary.durationDays} days</p>
              </div>
              {cycleSummary.cycleLengthDays !== null && (
                <div>
                  <p className="text-xs text-white/70">Cycle length</p>
                  <p className="text-lg font-semibold">{cycleSummary.cycleLengthDays} days</p>
                </div>
              )}
              {cycleSummary.averageFlow && (
                <div>
                  <p className="text-xs text-white/70">Average flow</p>
                  <p className="text-lg font-semibold">{FLOW_LABELS[cycleSummary.averageFlow]}</p>
                </div>
              )}
              {cycleSummary.heaviestDay && (
                <div>
                  <p className="text-xs text-white/70">Heaviest day</p>
                  <p className="text-lg font-semibold">Day {cycleSummary.heaviestDay}</p>
                </div>
              )}
              {cycleSummary.lightestDay && (
                <div>
                  <p className="text-xs text-white/70">Lightest day</p>
                  <p className="text-lg font-semibold">Day {cycleSummary.lightestDay}</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Flow Timeline */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card>
            <div className="mb-3 flex items-center gap-2 text-text">
              <Droplets className="h-4 w-4 text-danger" />
              <p className="font-semibold">Flow Timeline</p>
            </div>
            {flowTimeline.some((d) => d.flow) ? (
              <div className="space-y-1.5">
                {flowTimeline.map((day) => (
                  <div key={day.date} className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Day {day.dayNumber}</span>
                    <span className={day.flow ? 'font-medium text-text' : 'text-text-muted'}>
                      {day.flow ? FLOW_LABELS[day.flow] : 'Not logged'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No flow was logged this cycle.</p>
            )}
          </Card>
        </motion.div>

        {/* Mood Summary */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-text">
                <Smile className="h-4 w-4 text-primary" />
                <p className="font-semibold">Mood Summary</p>
              </div>
              {moodSummary.trend && <TrendIcon trend={moodSummary.trend} />}
            </div>
            {moodSummary.frequency.length > 0 ? (
              <div className="space-y-1.5">
                {moodSummary.frequency.map(({ mood, days }) => (
                  <div key={mood} className="flex items-center justify-between text-sm">
                    <span className="text-text">{mood}</span>
                    <span className="text-text-muted">
                      {days} day{days > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No mood was logged this cycle.</p>
            )}
          </Card>
        </motion.div>

        {/* Symptoms */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card>
            <div className="mb-3 flex items-center gap-2 text-text">
              <Activity className="h-4 w-4 text-warning" />
              <p className="font-semibold">Symptoms</p>
            </div>
            {symptomsSummary.topSymptoms.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {symptomsSummary.topSymptoms.map(({ symptom, count }) => (
                  <Badge key={symptom} tone="warning">
                    {symptom} · {count}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-text-muted">No symptoms were logged this cycle.</p>
            )}
          </Card>
        </motion.div>

        {/* Pain Summary */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card>
            <div className="mb-3 flex items-center gap-2 text-text">
              <Zap className="h-4 w-4 text-danger" />
              <p className="font-semibold">Pain Summary</p>
            </div>
            {painSummary.average !== null ? (
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Average pain</p>
                  <p className="text-lg font-semibold text-text">{painSummary.average.toFixed(1)}/10</p>
                </div>
                <div>
                  <p className="text-text-muted">Highest pain</p>
                  <p className="text-lg font-semibold text-text">{painSummary.highest}/10</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No pain was logged this cycle.</p>
            )}
          </Card>
        </motion.div>

        {/* Sleep Summary */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card>
            <div className="mb-3 flex items-center gap-2 text-text">
              <Moon className="h-4 w-4 text-primary" />
              <p className="font-semibold">Sleep Summary</p>
            </div>
            {sleepSummary.average !== null ? (
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-text-muted">Average</p>
                  <p className="text-lg font-semibold text-text">{sleepSummary.average.toFixed(1)}h</p>
                </div>
                <div>
                  <p className="text-text-muted">Best</p>
                  <p className="text-lg font-semibold text-text">{sleepSummary.best}h</p>
                </div>
                <div>
                  <p className="text-text-muted">Worst</p>
                  <p className="text-lg font-semibold text-text">{sleepSummary.worst}h</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No sleep was logged this cycle.</p>
            )}
          </Card>
        </motion.div>

        {/* Notes Summary */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card>
            <div className="mb-3 flex items-center gap-2 text-text">
              <FileText className="h-4 w-4 text-text-muted" />
              <p className="font-semibold">Notes</p>
            </div>
            {notesSummary.latestNote ? (
              <p className="text-sm text-text-muted">
                <span className="font-medium text-text">
                  {notesSummary.latestNoteDate && format(new Date(notesSummary.latestNoteDate), 'MMM d')}:
                </span>{' '}
                {notesSummary.latestNote}
              </p>
            ) : (
              <p className="text-sm text-text-muted">No notes were added this cycle.</p>
            )}
          </Card>
        </motion.div>

        {/* Personal Insights */}
        {insights.length > 0 && (
          <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
            <Card>
              <div className="mb-3 flex items-center gap-2 text-text">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="font-semibold">Personal Insights</p>
              </div>
              <ul className="space-y-2">
                {insights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {insight}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}

        {/* Compare With Previous Cycle */}
        {comparison && (
          <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
            <Card>
              <div className="mb-3 flex items-center gap-2 text-text">
                <BarChart3 className="h-4 w-4 text-primary" />
                <p className="font-semibold">Compare With Previous Cycle</p>
              </div>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Duration</span>
                  <span className="font-medium text-text">
                    {comparison.previousDurationDays}d → {comparison.currentDurationDays}d (
                    {comparison.durationDifferenceDays > 0 ? '+' : ''}
                    {comparison.durationDifferenceDays}d)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Flow</span>
                  <span className="font-medium text-text">{comparison.flowComparisonLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Pain</span>
                  <span className="font-medium text-text">{comparison.painComparisonLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-text-muted">Sleep</span>
                  <span className="font-medium text-text">{comparison.sleepComparisonLabel}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Completion Screen */}
        <motion.div custom={nextIndex()} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card className="flex flex-col items-center py-8 text-center">
            <motion.span
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
              className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"
            >
              <PartyPopper className="h-8 w-8 text-primary" />
            </motion.span>
            <h2 className="mb-1 text-xl font-bold text-text">🎉 Cycle Complete</h2>
            <p className="mb-1 font-medium text-text">Great job!</p>
            <p className="mb-6 max-w-xs text-sm text-text-muted">
              You&apos;ve completed another cycle. Keeping consistent records helps improve your predictions and gives
              you better insights over time.
            </p>
            <Button onClick={() => navigate('/dashboard')}>Continue</Button>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
