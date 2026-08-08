import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Copy, Share2, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Dialog } from '@/components/ui/Dialog';
import { useAuth } from '@/hooks/useAuth';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleService } from '@/services/coupleService';
import { notify } from '@/utils/toast';
import type { Database } from '@/types/database';

type CoupleInvite = Database['public']['Tables']['couple_invites']['Row'];

export default function CoupleConnect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { relationship, loading: relationshipLoading } = useRelationship();

  const [invite, setInvite] = useState<CoupleInvite | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [revokeConfirmOpen, setRevokeConfirmOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!user || relationship) return;
    coupleService.getMyPendingInvite(user.id).then(({ data }) => {
      setInvite(data);
      setLoadingInvite(false);
    });
  }, [user, relationship]);

  // Already connected - nothing to do here, send them to the dashboard.
  useEffect(() => {
    if (!relationshipLoading && relationship) {
      navigate('/couple/dashboard', { replace: true });
    }
  }, [relationshipLoading, relationship, navigate]);

  const inviteLink = invite ? `${window.location.origin}/couple/accept?code=${invite.invite_code}` : '';

  const handleCreateInvite = async () => {
    if (!user) return;
    setCreating(true);
    const { data, error } = await coupleService.createInvite(user.id);
    setCreating(false);
    if (error) {
      notify.error(error);
      return;
    }
    setInvite(data);
    notify.success('Invite created');
  };

  const handleRevoke = async () => {
    if (!invite) return;
    setRevoking(true);
    const { error } = await coupleService.revokeInvite(invite.id);
    setRevoking(false);
    setRevokeConfirmOpen(false);
    if (error) {
      notify.error(error);
      return;
    }
    setInvite(null);
    notify.success('Invite revoked');
  };

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify.success(`${label} copied`);
    } catch {
      notify.error('Could not copy - please copy it manually');
    }
  };

  const handleShare = async () => {
    if (!invite) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Connect with me on Ellara', url: inviteLink });
      } catch {
        // user cancelled the share sheet - not an error
      }
    } else {
      handleCopy(inviteLink, 'Invite link');
    }
  };

  const handleAccept = async () => {
    if (!codeInput.trim()) return;
    setAccepting(true);
    const { error } = await coupleService.acceptInvite(codeInput);
    setAccepting(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success("You're connected!");
    navigate('/couple/dashboard');
  };

  if (relationshipLoading || loadingInvite) return <Loading fullScreen />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">Couple Connect</h1>
      <Card className="text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Heart className="h-6 w-6 text-primary" />
        </span>
        <p className="font-semibold text-text">Connect with your partner</p>
        <p className="text-sm text-text-muted">Share an invite, or enter the code they sent you.</p>
      </Card>

      <Card>
        <p className="mb-3 font-semibold text-text">Invite your partner</p>
        {invite ? (
          <div className="space-y-3">
            <div className="rounded-input border border-dashed border-primary/40 bg-primary/5 py-4 text-center">
              <p className="text-xs text-text-muted">Invite code</p>
              <p className="text-2xl font-bold tracking-[0.3em] text-primary">{invite.invite_code}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" icon={<Copy className="h-4 w-4" />} onClick={() => handleCopy(invite.invite_code, 'Code')}>
                Copy Code
              </Button>
              <Button icon={<Share2 className="h-4 w-4" />} onClick={handleShare}>
                Share Link
              </Button>
            </div>
            <button
              onClick={() => setRevokeConfirmOpen(true)}
              className="flex w-full items-center justify-center gap-1.5 py-1 text-sm font-medium text-danger"
            >
              <X className="h-3.5 w-3.5" /> Revoke invite
            </button>
            <p className="text-center text-xs text-text-muted">Expires {new Date(invite.expires_at).toLocaleDateString()}</p>
          </div>
        ) : (
          <Button loading={creating} onClick={handleCreateInvite}>
            Generate Invite
          </Button>
        )}
      </Card>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gray-200" />
        <span className="text-xs text-text-muted">or</span>
        <div className="h-px flex-1 bg-gray-200" />
      </div>

      <Card>
        <p className="mb-3 font-semibold text-text">Have a code?</p>
        <div className="space-y-3">
          <Input
            placeholder="Enter invite code"
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
            maxLength={8}
            className="text-center tracking-[0.3em]"
          />
          <Button disabled={!codeInput.trim()} loading={accepting} onClick={handleAccept}>
            Connect
          </Button>
        </div>
      </Card>

      <Dialog
        open={revokeConfirmOpen}
        onClose={() => setRevokeConfirmOpen(false)}
        onConfirm={handleRevoke}
        title="Revoke this invite?"
        description="The code will no longer work. You can generate a new one anytime."
        confirmLabel="Revoke"
        tone="danger"
        loading={revoking}
      />
    </div>
  );
}
