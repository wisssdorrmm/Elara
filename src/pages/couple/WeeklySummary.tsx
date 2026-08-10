import { useEffect, useState } from 'react';
import { BarChart3, Flame, Calendar, Gift, MessageCircle } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import { formatRelationshipDuration } from '@/utils/relationship';
import type { Database } from '@/types';

type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row'];
type CoupleDate = Database['public']['Tables']['couple_dates']['Row'];
type CoupleStreak = Database['public']['Tables']['couple_streaks']['Row'];

export default function WeeklySummary() {
  const { relationship, loading: relationshipLoading } = useRelationship();
  const [checkins, setCheckins] = useState<DailyCheckin[]>([]);
  const [dates, setDates] = useState<CoupleDate[]>([]);
  const [streaks, setStreaks] = useState<CoupleStreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!relationship) return;
    setLoading(true);
    const [checkinsRes, datesRes, streaksRes] = await Promise.all([
      coupleEngagementService.getRecentCheckins(relationship.id, 7),
      coupleEngagementService.getDates(relationship.id),
      coupleEngagementService.getStreaks(relationship.id),
    ]);
    const firstError = checkinsRes.error || datesRes.error || streaksRes.error;
    if (firstError) {
      setError(firstError);
    } else {
      setCheckins(checkinsRes.data ?? []);
      const since = new Date();
      since.setDate(since.getDate() - 7);
      setDates((datesRes.data ?? []).filter((d) => new Date(d.date_on) >= since));
      setStreaks(streaksRes.data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (relationship) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationship?.id]);

  const checkinStreak = streaks.find((s) => s.streak_type === 'daily_checkin');
  const totalActivity = checkins.length + dates.length;

  return (
    <div>
      <Navbar title="Weekly Summary" showBack />
      <div className="app-page space-y-4 pt-0">
        {relationshipLoading || loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message="We couldn't load your weekly summary." onRetry={load} />
        ) : !relationship ? (
          <EmptyState icon={BarChart3} title="Not connected yet" description="Connect with your partner to see weekly summaries." />
        ) : totalActivity === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="Not enough activity to generate a full summary yet"
            description="Complete a check-in or log a date this week to start building your summary."
          />
        ) : (
          <>
            <Card className="bg-gradient-to-br from-primary to-secondary text-center text-white">
              <p className="text-sm text-white/80">Together for</p>
              <p className="text-lg font-bold">{formatRelationshipDuration(relationship.relationship_start_date)}</p>
            </Card>

            <div className="grid grid-cols-2 gap-3">
              <Card padding="sm">
                <MessageCircle className="mb-1.5 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-text">{checkins.length}</p>
                <p className="text-xs text-text-muted">Check-ins this week</p>
              </Card>
              <Card padding="sm">
                <Calendar className="mb-1.5 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-text">{dates.length}</p>
                <p className="text-xs text-text-muted">Dates logged this week</p>
              </Card>
              <Card padding="sm">
                <Flame className="mb-1.5 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-text">{checkinStreak?.current_streak ?? 0}</p>
                <p className="text-xs text-text-muted">Current check-in streak</p>
              </Card>
              <Card padding="sm">
                <Gift className="mb-1.5 h-5 w-5 text-primary" />
                <p className="text-2xl font-bold text-text">{checkinStreak?.longest_streak ?? 0}</p>
                <p className="text-xs text-text-muted">Longest streak so far</p>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
