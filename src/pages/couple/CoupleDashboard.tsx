import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Pencil, Flame, Trophy, Calendar, Gift, MessageCircle, BarChart3, Cake, Unlink } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dialog } from '@/components/ui/Dialog';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleService } from '@/services/coupleService';
import { formatRelationshipDuration, daysUntilNextAnnualDate } from '@/utils/relationship';
import { notify } from '@/utils/toast';

const comingSoonCards = [
  { label: 'Couple Streak', icon: Flame, description: 'Daily check-in and date-night streaks' },
  { label: 'Couple Level', icon: Trophy, description: 'Earn XP together and level up' },
  { label: 'Last Date', icon: Calendar, description: 'Your logged date history' },
  { label: 'Weekly Challenge', icon: Gift, description: 'A new challenge every week' },
  { label: 'Daily Check-in', icon: MessageCircle, description: 'How are you feeling today?' },
  { label: 'Weekly Summary', icon: BarChart3, description: 'Your week together, summarized' },
];

export default function CoupleDashboard() {
  const navigate = useNavigate();
  const { relationship, loading, error, refetch } = useRelationship();
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

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

  if (loading) return <Loading fullScreen />;
  if (error) return <ErrorState message="We couldn't load your couple dashboard." onRetry={refetch} />;
  if (!relationship) {
    return (
      <div>
        <Navbar title="Couple" showBack />
        <div className="app-page pt-0 text-center">
          <p className="mb-2 font-semibold text-text">Not connected yet</p>
          <p className="mb-6 text-text-muted">Connect with your partner to unlock the couple dashboard.</p>
          <Button onClick={() => navigate('/couple')}>Connect with Partner</Button>
        </div>
      </div>
    );
  }

  const daysToAnniversary = daysUntilNextAnnualDate(relationship.anniversary_date);

  return (
    <div>
      <Navbar
        title={relationship.nickname || 'Your Relationship'}
        showBack
        right={
          <button
            onClick={() => navigate('/couple/details')}
            aria-label="Edit relationship details"
            className="rounded-full p-2 text-text-muted hover:bg-black/5"
          >
            <Pencil className="h-4.5 w-4.5" />
          </button>
        }
      />

      <div className="app-page space-y-4 pt-0">
        <Card className="bg-gradient-to-br from-primary to-secondary text-center text-white">
          <span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15">
            <Heart className="h-5 w-5" />
          </span>
          <p className="text-sm text-white/80">Together for</p>
          <p className="text-xl font-bold">{formatRelationshipDuration(relationship.started_at)}</p>
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

        <div className="grid grid-cols-2 gap-3">
          {comingSoonCards.map(({ label, icon: Icon, description }) => (
            <Card key={label} padding="sm" className="relative">
              <Badge tone="neutral" className="absolute right-3 top-3 text-[10px]">
                Soon
              </Badge>
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                <Icon className="h-4 w-4 text-primary" />
              </span>
              <p className="text-sm font-semibold text-text">{label}</p>
              <p className="text-xs text-text-muted">{description}</p>
            </Card>
          ))}
        </div>

        <button
          onClick={() => setDisconnectOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-danger"
        >
          <Unlink className="h-4 w-4" /> Disconnect
        </button>
      </div>

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
    </div>
  );
}
