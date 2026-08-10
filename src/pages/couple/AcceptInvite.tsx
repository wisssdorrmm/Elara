import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { coupleService } from '@/services/coupleService';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import { notify } from '@/utils/toast';

export default function AcceptInvite() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const codeFromLink = searchParams.get('code') ?? '';

  const [code, setCode] = useState(codeFromLink);
  const [accepting, setAccepting] = useState(false);

  // If they're not logged in yet, send them to register but keep the code so
  // they can come straight back here (they'll need to re-open the link, but
  // at least they land on the right screen instead of a dead end).
  useEffect(() => {
    if (!user) {
      notify.info('Create an account or log in first, then use this invite link again.');
    }
  }, [user]);

  const handleAccept = async () => {
    if (!code.trim() || !user) return;
    setAccepting(true);
    const { data: relationshipId, error } = await coupleService.acceptInvite(code);
    setAccepting(false);
    if (error) {
      notify.error(error);
      return;
    }
    if (relationshipId) coupleEngagementService.notifyRelationshipConnected(relationshipId);
    notify.success("You're connected!");
    navigate('/couple/dashboard');
  };

  return (
    <div>
      <Navbar title="Accept Invite" showBack />
      <div className="app-page pt-0">
        <Card className="text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-6 w-6 text-primary" />
          </span>
          <p className="mb-4 font-semibold text-text">You've been invited to connect</p>

          <Input
            placeholder="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="mb-4 text-center tracking-[0.3em]"
          />

          {user ? (
            <Button disabled={!code.trim()} loading={accepting} onClick={handleAccept}>
              Accept & Connect
            </Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={() => navigate('/register')}>Create Account</Button>
              <Button variant="outline" onClick={() => navigate('/login')}>
                Log In
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
