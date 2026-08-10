import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  Heart,
  Pencil,
  Flame,
  Trophy,
  Calendar,
  Gift,
  MessageCircle,
  BarChart3,
  Cake,
  PartyPopper,
  Unlink,
  Check,
  Send,
  Bell,
  Star,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dialog } from '@/components/ui/Dialog';
import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/hooks/useAuth';
import { useRelationship } from '@/hooks/useRelationship';
import { useCoupleEngagement } from '@/hooks/useCoupleEngagement';
import { coupleService } from '@/services/coupleService';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import { formatRelationshipDuration, daysUntilNextAnnualDate } from '@/utils/relationship';
import { getCoupleLevel } from '@/utils/coupleLevel';
import { notify } from '@/utils/toast';
import { BADGE_DEFINITIONS, WEEKLY_CHALLENGE_DEFINITIONS, APPRECIATION_PRESETS, PARTNER_ALERT_OPTIONS } from '@/constants';
import type { PartnerAlertType } from '@/types';

export default function CoupleDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { relationship, loading: relationshipLoading, error: relationshipError, refetch: refetchRelationship } = useRelationship();
  const {
    streaks,
    totalXp,
    badges,
    weeklyChallenge,
    todayCheckin,
    recentDates,
    loading: engagementLoading,
    error: engagementError,
    refetch: refetchEngagement,
  } = useCoupleEngagement(relationship?.id ?? null);

  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [appreciationOpen, setAppreciationOpen] = useState(false);
  const [appreciationText, setAppreciationText] = useState('');
  const [sendingAppreciation, setSendingAppreciation] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [completingChallenge, setCompletingChallenge] = useState(false);

  const partnerId =
    relationship && user ? (relationship.user_one_id === user.id ? relationship.user_two_id : relationship.user_one_id) : null;

  const handleDisconnect = async () => {
    if (!relationship) return;
    setDisconnecting(true);
    const { error: endError } = await coupleService.endRelationship(relationship.id);
    setDisconnecting(false);
    setDisconnectOpen(false);
    if (endError) {
      notify.error(endError);
      return;
    }
    notify.success('Disconnected');
    navigate('/couple');
  };

  const handleSendAppreciation = async (message: string) => {
    if (!relationship || !user || !partnerId || !message.trim()) return;
    setSendingAppreciation(true);
    const { error } = await coupleEngagementService.sendAppreciation(relationship.id, user.id, partnerId, message.trim());
    setSendingAppreciation(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Appreciation sent 💌');
    setAppreciationOpen(false);
    setAppreciationText('');
  };

  const handleSendAlert = async (alertType: PartnerAlertType) => {
    if (!relationship || !user || !partnerId) return;
    setSendingAlert(true);
    const { error } = await coupleEngagementService.sendPartnerAlert(relationship.id, user.id, partnerId, alertType);
    setSendingAlert(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Alert sent');
    setAlertOpen(false);
  };

  const handleCompleteChallenge = async () => {
    if (!weeklyChallenge) return;
    setCompletingChallenge(true);
    const { error } = await coupleEngagementService.completeWeeklyChallenge(weeklyChallenge.id);
    setCompletingChallenge(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Challenge completed! 🎁');
    refetchEngagement();
  };

  const loading = relationshipLoading || (relationship != null && engagementLoading);
  const error = relationshipError || engagementError;

  if (loading) return <Loading fullScreen />;
  if (error) {
    return (
      <ErrorState
        message="We couldn't load your couple dashboard."
        onRetry={() => {
          refetchRelationship();
          refetchEngagement();
        }}
      />
    );
  }
  if (!relationship) {
    return (
      <div className="space-y-5 text-center">
        <h1 className="text-xl font-bold text-text">Couple</h1>
        <p className="mb-2 font-semibold text-text">Not connected yet</p>
        <p className="mb-6 text-text-muted">Connect with your partner to unlock the couple dashboard.</p>
        <Button onClick={() => navigate('/couple')}>Connect with Partner</Button>
      </div>
    );
  }

  const daysToAnniversary = daysUntilNextAnnualDate(relationship.anniversary);
  const daysToPartnerBirthday = daysUntilNextAnnualDate(relationship.partner_birthday);
  const checkinStreak = streaks.find((s) => s.streak_type === 'daily_checkin');
  const level = getCoupleLevel(totalXp);
  const lastDate = recentDates[0] ?? null;
  const challengeInfo = weeklyChallenge ? WEEKLY_CHALLENGE_DEFINITIONS[weeklyChallenge.challenge_key] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text">Your Relationship</h1>
        <button
          onClick={() => navigate('/couple/details')}
          aria-label="Edit relationship details"
          className="rounded-full p-2 text-text-muted hover:bg-black/5"
        >
          <Pencil className="h-4.5 w-4.5" />
        </button>
      </div>

      <Card className="bg-gradient-to-br from-primary to-secondary text-center text-white">
        <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
          <Heart className="h-5 w-5" />
        </span>
        <p className="text-sm text-white/80">Together for</p>
        <p className="text-xl font-bold">{formatRelationshipDuration(relationship.relationship_start_date)}</p>
      </Card>

      {daysToAnniversary !== null && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Cake className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-sm text-text-muted">Next anniversary</p>
              <p className="font-semibold text-text">
                {daysToAnniversary === 0 ? 'Today! 🎉' : `In ${daysToAnniversary} day${daysToAnniversary > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {daysToPartnerBirthday !== null && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-5 w-5 text-primary" />
            </span>
            <div>
              <p className="text-sm text-text-muted">Partner's birthday</p>
              <p className="font-semibold text-text">
                {daysToPartnerBirthday === 0
                  ? 'Today! 🎉'
                  : `In ${daysToPartnerBirthday} day${daysToPartnerBirthday > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Couple Streak */}
      <Card>
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Flame className="h-5 w-5 text-primary" />
          </span>
          <div className="flex-1">
            <p className="text-sm text-text-muted">Couple Streak</p>
            <p className="font-semibold text-text">
              {checkinStreak && checkinStreak.current_streak > 0
                ? `${checkinStreak.current_streak} day${checkinStreak.current_streak > 1 ? 's' : ''}`
                : 'No streak yet'}
            </p>
          </div>
          {checkinStreak && checkinStreak.longest_streak > 0 && (
            <span className="text-xs text-text-muted">Best: {checkinStreak.longest_streak}d</span>
          )}
        </div>
      </Card>

      {/* Couple Level / XP */}
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            <p className="font-semibold text-text">{level.name}</p>
          </div>
          <span className="text-xs text-text-muted">{level.xp} XP</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${level.progress}%` }} />
        </div>
        {level.nextLevelXp !== null && (
          <p className="mt-1.5 text-xs text-text-muted">{level.nextLevelXp - level.xp} XP to next level</p>
        )}
      </Card>

      {/* Last Date */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <p className="font-semibold text-text">Last Date</p>
        </div>
        {lastDate ? (
          <div>
            <p className="text-sm text-text">{lastDate.title}</p>
            <p className="text-xs text-text-muted">{format(new Date(lastDate.date_on), 'MMM d, yyyy')}</p>
          </div>
        ) : (
          <p className="mb-2 text-sm text-text-muted">No dates logged yet.</p>
        )}
        <Button variant="ghost" fullWidth={false} className="mt-2 px-0" onClick={() => navigate('/couple/dates/new')}>
          Log a date
        </Button>
      </Card>

      {/* Weekly Challenge */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <Gift className="h-4 w-4 text-primary" />
          <p className="font-semibold text-text">Weekly Challenge</p>
        </div>
        {challengeInfo && (
          <>
            <p className="text-sm text-text">{challengeInfo.title}</p>
            <p className="mb-3 text-xs text-text-muted">{challengeInfo.description}</p>
            {weeklyChallenge?.status === 'completed' ? (
              <Badge tone="success">Completed</Badge>
            ) : (
              <Button
                variant="outline"
                fullWidth={false}
                className="px-4"
                icon={<Check className="h-4 w-4" />}
                loading={completingChallenge}
                onClick={handleCompleteChallenge}
              >
                Mark Complete
              </Button>
            )}
          </>
        )}
      </Card>

      {/* Daily Check-in */}
      <Card>
        <div className="mb-2 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          <p className="font-semibold text-text">Daily Check-in</p>
        </div>
        {todayCheckin ? (
          <Badge tone="success">Checked in today</Badge>
        ) : (
          <Button variant="outline" fullWidth={false} className="px-4" onClick={() => navigate('/couple/checkin')}>
            Check in now
          </Button>
        )}
      </Card>

      {/* Weekly Summary */}
      <Card interactive onClick={() => navigate('/couple/summary')} role="button">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </span>
          <p className="flex-1 font-semibold text-text">Weekly Summary</p>
        </div>
      </Card>

      {/* Badges */}
      {badges.length > 0 && (
        <Card>
          <p className="mb-3 font-semibold text-text">Badges</p>
          <div className="flex flex-wrap gap-2">
            {badges.map((b) => {
              const def = BADGE_DEFINITIONS[b.badge_key];
              if (!def) return null;
              return (
                <Badge key={b.id} tone="primary">
                  {def.emoji} {def.label}
                </Badge>
              );
            })}
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" icon={<Send className="h-4 w-4" />} onClick={() => setAppreciationOpen(true)}>
          Appreciate
        </Button>
        <Button variant="outline" icon={<Bell className="h-4 w-4" />} onClick={() => setAlertOpen(true)}>
          Send Alert
        </Button>
      </div>

      <Card interactive onClick={() => navigate('/couple/timeline')} role="button">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Star className="h-5 w-5 text-primary" />
          </span>
          <p className="flex-1 font-semibold text-text">View Timeline</p>
        </div>
      </Card>

      <button
        onClick={() => setDisconnectOpen(true)}
        className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-danger"
      >
        <Unlink className="h-4 w-4" /> Disconnect
      </button>

      <Dialog
        open={disconnectOpen}
        onClose={() => setDisconnectOpen(false)}
        onConfirm={handleDisconnect}
        title="Disconnect from your partner?"
        description="This ends your relationship connection in Ellara. Your individual data stays private and untouched."
        confirmLabel="Disconnect"
        tone="danger"
        loading={disconnecting}
      />

      <Modal open={appreciationOpen} onClose={() => setAppreciationOpen(false)} title="Send an appreciation">
        <div className="space-y-2">
          {APPRECIATION_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleSendAppreciation(preset)}
              disabled={sendingAppreciation}
              className="block w-full rounded-input border border-gray-200 bg-white px-4 py-3 text-left text-sm text-text hover:bg-gray-50"
            >
              {preset}
            </button>
          ))}
          <textarea
            value={appreciationText}
            onChange={(e) => setAppreciationText(e.target.value)}
            placeholder="Or write your own..."
            rows={2}
            className="w-full rounded-input border border-gray-200 bg-white px-4 py-3 text-sm placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button disabled={!appreciationText.trim()} loading={sendingAppreciation} onClick={() => handleSendAppreciation(appreciationText)}>
            Send
          </Button>
        </div>
      </Modal>

      <Modal open={alertOpen} onClose={() => setAlertOpen(false)} title="Send a quick alert">
        <div className="space-y-2">
          {PARTNER_ALERT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleSendAlert(value)}
              disabled={sendingAlert}
              className="block w-full rounded-input border border-gray-200 bg-white px-4 py-3 text-left text-sm text-text hover:bg-gray-50"
            >
              {label}
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
