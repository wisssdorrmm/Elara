import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import type { Database } from '@/types/database';

type CoupleStreak = Database['public']['Tables']['couple_streaks']['Row'];
type DailyCheckin = Database['public']['Tables']['daily_checkins']['Row'];
type CoupleDate = Database['public']['Tables']['couple_dates']['Row'];
type Badge = Database['public']['Tables']['couple_badges']['Row'];
type WeeklyChallenge = Database['public']['Tables']['couple_weekly_challenges']['Row'];

export interface CoupleEngagement {
  streaks: CoupleStreak[];
  totalXp: number;
  badges: Badge[];
  weeklyChallenge: WeeklyChallenge | null;
  todayCheckin: DailyCheckin | null;
  recentDates: CoupleDate[];
}

const EMPTY: CoupleEngagement = { streaks: [], totalXp: 0, badges: [], weeklyChallenge: null, todayCheckin: null, recentDates: [] };

export function useCoupleEngagement(relationshipId: string | null) {
  const { user } = useAuth();
  const [engagement, setEngagement] = useState<CoupleEngagement>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!relationshipId || !user) {
      setEngagement(EMPTY);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const [streaksRes, xpRes, badgesRes, challengeRes, checkinRes, datesRes] = await Promise.all([
      coupleEngagementService.getStreaks(relationshipId),
      coupleEngagementService.getXpTotal(relationshipId),
      coupleEngagementService.getBadges(relationshipId),
      coupleEngagementService.getOrCreateWeeklyChallenge(relationshipId),
      coupleEngagementService.getTodayCheckin(relationshipId, user.id),
      coupleEngagementService.getDates(relationshipId),
    ]);

    const firstError =
      streaksRes.error || xpRes.error || badgesRes.error || challengeRes.error || checkinRes.error || datesRes.error;

    if (firstError) {
      setError(firstError);
    } else {
      setEngagement({
        streaks: streaksRes.data ?? [],
        totalXp: xpRes.data?.total_xp ?? 0,
        badges: badgesRes.data ?? [],
        weeklyChallenge: challengeRes.data ?? null,
        todayCheckin: checkinRes.data ?? null,
        recentDates: (datesRes.data ?? []).slice(0, 5),
      });
    }
    setLoading(false);
  }, [relationshipId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { ...engagement, loading, error, refetch: refresh };
}
