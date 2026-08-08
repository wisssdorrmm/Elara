import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Pencil, Flame, Trophy, Calendar, Gift, MessageCircle, BarChart3, Cake, PartyPopper, Unlink, Send, Star, Clock3 } from 'lucide-react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Dialog } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/Input';
import { useRelationship } from '@/hooks/useRelationship';
import { useAuth } from '@/hooks/useAuth';
import { coupleService } from '@/services/coupleService';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import { formatRelationshipDuration, daysUntilNextAnnualDate } from '@/utils/relationship';
import { notify } from '@/utils/toast';
import type { AlertType, CoupleFeeling } from '@/types/couple';

const feelings: { value: CoupleFeeling; label: string }[] = [
  { value: 'loved', label: '❤️ Loved' }, { value: 'happy', label: '😊 Happy' }, { value: 'supported', label: '🤗 Supported' },
  { value: 'appreciated', label: '🙏 Appreciated' }, { value: 'peaceful', label: '😌 Peaceful' }, { value: 'hurt', label: '😔 Hurt' }, { value: 'ignored', label: '😴 Ignored' },
];
const alerts: { type: AlertType; label: string }[] = [
  { type: 'thinking_of_you', label: 'Thinking of you ❤️' }, { type: 'sending_love', label: 'Sending love 💕' },
  { type: 'here_for_you', label: 'I’m here for you 🫶' }, { type: 'hope_you_are_well', label: 'Hope you’re good 😊' },
  { type: 'feeling_down', label: 'I’m feeling down 🥺' }, { type: 'call_me', label: 'Call me 📞' },
];

function levelForXp(xp: number) {
  const levels = [
    ['New Sparks', 0], ['Growing Hearts', 100], ['Soul Partners', 300], ['Golden Hearts', 700], ['Forever Together', 1500],
  ] as const;
  let current = levels[0];
  let next = levels[1];
  for (let i = 0; i < levels.length; i++) { if (xp >= levels[i][1]) { current = levels[i]; next = levels[i + 1] ?? levels[i]; } }
  const span = Math.max(1, next[1] - current[1]);
  return { name: current[0], progress: current[0] === 'Forever Together' ? 100 : Math.min(100, Math.round(((xp - current[1]) / span) * 100)) };
}

export default function CoupleDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { relationship, loading, error, refetch } = useRelationship();
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [weekly, setWeekly] = useState<any>(null);
  const [badges, setBadges] = useState<any[]>([]);
  const [challenge, setChallenge] = useState<any>(null);
  const [checkin, setCheckin] = useState<any>(null);
  const [feeling, setFeeling] = useState<CoupleFeeling>('loved');
  const [note, setNote] = useState('');
  const [shareCheckin, setShareCheckin] = useState(false);
  const [appreciation, setAppreciation] = useState('');
  const [dateTitle, setDateTitle] = useState('');
  const [dateOn, setDateOn] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateLocation, setDateLocation] = useState('');
  const [dateRating, setDateRating] = useState('');
  const [dateNotes, setDateNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const partnerId = useMemo(() => user && relationship ? (relationship.user_one_id === user.id ? relationship.user_two_id : relationship.user_one_id) : null, [user, relationship]);

  const refreshEngagement = async () => {
    if (!relationship || !user) return;
    const [s, c, myCheckin, w] = await Promise.all([
      coupleEngagementService.getStats(relationship.id),
      coupleEngagementService.getChallenge(relationship.id),
      coupleEngagementService.getMyCheckin(relationship.id, user.id),
      coupleEngagementService.getWeeklySummary(relationship.id),
    ]);
    if (!s.error) { setStats(s.data); const b = await coupleEngagementService.syncBadges(relationship.id, { checkins: s.data?.checkins ?? 0, dates: s.data?.dates ?? 0, xp: s.data?.xp ?? 0, streak: s.data?.streak?.current_count ?? 0, appreciations: s.data?.appreciations ?? 0 }); setBadges(b.data ?? []); }
    if (!w.error) setWeekly(w.data);
    setChallenge(c);
    setCheckin(myCheckin.data);
  };

  useEffect(() => { refreshEngagement(); }, [relationship?.id, user?.id]);

  const handleDisconnect = async () => {
    if (!relationship) return;
    setDisconnecting(true);
    const { error: endError } = await coupleService.endRelationship(relationship.id);
    setDisconnecting(false); setDisconnectOpen(false);
    if (endError) notify.error(endError); else { notify.success('Disconnected'); navigate('/couple'); }
  };

  const saveCheckin = async () => {
    if (!relationship || !user) return;
    setBusy(true);
    const { error: e } = await coupleEngagementService.saveCheckin(relationship.id, user.id, feeling, note, shareCheckin);
    setBusy(false);
    if (e) notify.error(e); else { notify.success('Check-in saved ❤️'); setCheckin({ feeling, note, is_shared: shareCheckin }); await refreshEngagement(); }
  };

  const sendAppreciation = async () => {
    if (!relationship || !user || !partnerId || !appreciation.trim()) return;
    setBusy(true);
    const { error: e } = await coupleEngagementService.sendAppreciation(relationship.id, user.id, partnerId, appreciation.trim());
    setBusy(false);
    if (e) notify.error(e); else { notify.success('Appreciation sent 💌'); setAppreciation(''); await refreshEngagement(); }
  };

  const logDate = async () => {
    if (!relationship || !user || !dateTitle.trim()) return;
    setBusy(true);
    const { error: e } = await coupleEngagementService.createDate(relationship.id, user.id, { title: dateTitle.trim(), date_on: dateOn, location: dateLocation, rating: dateRating ? Number(dateRating) : undefined, notes: dateNotes });
    setBusy(false);
    if (e) notify.error(e); else { notify.success('Date saved 📅'); setDateTitle(''); setDateLocation(''); setDateRating(''); setDateNotes(''); await refreshEngagement(); }
  };

  const completeChallenge = async () => {
    if (!relationship || !user || !challenge.challenge || challenge.progress?.completed) return;
    setBusy(true);
    const { error: e } = await coupleEngagementService.completeChallenge(relationship.id, user.id, challenge.challenge.id, challenge.challenge.xp_reward);
    setBusy(false);
    if (e) notify.error(e); else { notify.success('Challenge completed 🎁'); await refreshEngagement(); }
  };

  if (loading) return <Loading fullScreen />;
  if (error) return <ErrorState message="We couldn't load your couple dashboard." onRetry={refetch} />;
  if (!relationship) return <div className="space-y-5 text-center"><h1 className="text-xl font-bold text-text">Couple</h1><p className="font-semibold text-text">Not connected yet</p><p className="mb-6 text-text-muted">Connect with your partner to unlock the couple dashboard.</p><Button onClick={() => navigate('/couple')}>Connect with Partner</Button></div>;

  const daysToAnniversary = daysUntilNextAnnualDate(relationship.anniversary);
  const daysToPartnerBirthday = daysUntilNextAnnualDate(relationship.partner_birthday);
  const level = levelForXp(stats?.xp ?? 0);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center justify-between"><div><p className="text-xs uppercase tracking-wide text-text-muted">Ellara Couple</p><h1 className="text-xl font-bold text-text">Your Relationship ❤️</h1></div><button onClick={() => navigate('/couple/details')} aria-label="Edit relationship details" className="rounded-full p-2 text-text-muted hover:bg-black/5"><Pencil className="h-4 w-4" /></button></div>
      <Card className="bg-gradient-to-br from-primary to-secondary text-center text-white"><span className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/15"><Heart className="h-5 w-5" /></span><p className="text-sm text-white/80">Together for</p><p className="text-xl font-bold">{formatRelationshipDuration(relationship.relationship_start_date)}</p></Card>

      <div className="grid grid-cols-2 gap-3">
        <Card padding="sm"><Flame className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-text-muted">Couple streak</p><p className="text-2xl font-bold text-text">{stats?.streak?.current_count ?? 0} 🔥</p></Card>
        <Card padding="sm"><Trophy className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-text-muted">Level</p><p className="font-bold text-text">{level.name}</p><div className="mt-2 h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary" style={{ width: `${level.progress}%` }} /></div><p className="mt-1 text-[11px] text-text-muted">{stats?.xp ?? 0} XP</p></Card>
      </div>

      {(daysToAnniversary !== null || daysToPartnerBirthday !== null) && <div className="grid grid-cols-2 gap-3">
        {daysToAnniversary !== null && <Card padding="sm"><Cake className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-text-muted">Anniversary</p><p className="font-semibold text-text">{daysToAnniversary === 0 ? 'Today 🎉' : `${daysToAnniversary} day${daysToAnniversary === 1 ? '' : 's'}`}</p></Card>}
        {daysToPartnerBirthday !== null && <Card padding="sm"><PartyPopper className="mb-2 h-5 w-5 text-primary" /><p className="text-xs text-text-muted">Birthday</p><p className="font-semibold text-text">{daysToPartnerBirthday === 0 ? 'Today 🎉' : `${daysToPartnerBirthday} day${daysToPartnerBirthday === 1 ? '' : 's'}`}</p></Card>}
      </div>}

      <Card><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-text">Today&apos;s check-in</h2><p className="text-xs text-text-muted">A small daily habit for both of you.</p></div><MessageCircle className="h-5 w-5 text-primary" /></div>{checkin ? <div className="rounded-card bg-primary/5 p-3 text-sm"><p className="font-semibold text-text">{feelings.find(f => f.value === checkin.feeling)?.label ?? checkin.feeling}</p><p className="mt-1 text-text-muted">{checkin.note || 'No note added.'}</p><Badge tone="neutral" className="mt-2">{checkin.is_shared ? 'Shared with partner' : 'Private'}</Badge></div> : <div className="space-y-3"><div className="grid grid-cols-2 gap-2">{feelings.map(f => <button key={f.value} onClick={() => setFeeling(f.value)} className={`rounded-button border px-3 py-2 text-xs ${feeling === f.value ? 'border-primary bg-primary/10 text-primary' : 'border-gray-200 text-text'}`}>{f.label}</button>)}</div><Input placeholder="Optional note" value={note} onChange={e => setNote(e.target.value)} /><label className="flex items-center gap-2 text-xs text-text-muted"><input type="checkbox" checked={shareCheckin} onChange={e => setShareCheckin(e.target.checked)} /> Share this check-in with my partner</label><Button loading={busy} onClick={saveCheckin}>Save check-in</Button></div>}</Card>

      <Card><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-text">Send appreciation 💌</h2><p className="text-xs text-text-muted">Let your partner know you noticed them.</p></div><Heart className="h-5 w-5 text-primary" /></div><Input placeholder="What do you appreciate about them?" value={appreciation} onChange={e => setAppreciation(e.target.value)} /><Button className="mt-3" loading={busy} icon={<Send className="h-4 w-4" />} onClick={sendAppreciation}>Send</Button></Card>

      <Card><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-text">Quick partner alerts</h2><p className="text-xs text-text-muted">Send a one-tap nudge.</p></div><BellIcon /></div><div className="grid grid-cols-2 gap-2">{alerts.map(a => <button key={a.type} onClick={async () => { if (!partnerId || !user) return; const r = await coupleEngagementService.sendAlert(relationship.id, user.id, partnerId, a.type); r.error ? notify.error(r.error) : notify.success('Sent ❤️'); }} className="rounded-button border border-gray-200 px-3 py-2 text-left text-xs font-medium text-text hover:bg-primary/5">{a.label}</button>)}</div></Card>

      <Card><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-text">Weekly challenge</h2><p className="text-xs text-text-muted">Do something meaningful together.</p></div><Gift className="h-5 w-5 text-primary" /></div>{challenge.challenge ? <><p className="font-semibold text-text">{challenge.challenge.title}</p><p className="mt-1 text-sm text-text-muted">{challenge.challenge.description}</p><p className="mt-2 text-xs text-primary">+{challenge.challenge.xp_reward} XP</p><Button className="mt-3" variant={challenge.progress?.completed ? 'outline' : 'primary'} disabled={challenge.progress?.completed} loading={busy} onClick={completeChallenge}>{challenge.progress?.completed ? 'Completed ✓' : 'Mark complete'}</Button></> : <p className="text-sm text-text-muted">This week&apos;s challenge is being prepared.</p>}</Card>

      <Card><div className="mb-3 flex items-center justify-between"><div><h2 className="font-semibold text-text">Log a date 📅</h2><p className="text-xs text-text-muted">Keep your memories together.</p></div><Calendar className="h-5 w-5 text-primary" /></div><div className="space-y-3"><Input placeholder="Date title" value={dateTitle} onChange={e => setDateTitle(e.target.value)} /><Input type="date" value={dateOn} onChange={e => setDateOn(e.target.value)} /><Input placeholder="Location (optional)" value={dateLocation} onChange={e => setDateLocation(e.target.value)} /><div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /><select value={dateRating} onChange={e => setDateRating(e.target.value)} className="w-full rounded-button border border-gray-200 bg-white px-3 py-2 text-sm"><option value="">Rating</option>{[1,2,3,4,5].map(n => <option key={n} value={n}>{n}/5</option>)}</select></div><Input placeholder="Notes (optional)" value={dateNotes} onChange={e => setDateNotes(e.target.value)} /><Button loading={busy} onClick={logDate}>Save date</Button></div></Card>

      <Card><div className="mb-3 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><div><h2 className="font-semibold text-text">This week</h2><p className="text-xs text-text-muted">Your real activity so far.</p></div></div><div className="grid grid-cols-4 gap-2 text-center"><div><p className="text-lg font-bold text-text">{weekly?.checkins ?? 0}</p><p className="text-[10px] text-text-muted">Check-ins</p></div><div><p className="text-lg font-bold text-text">{weekly?.appreciations ?? 0}</p><p className="text-[10px] text-text-muted">Appreciation</p></div><div><p className="text-lg font-bold text-text">{weekly?.dates ?? 0}</p><p className="text-[10px] text-text-muted">Dates</p></div><div><p className="text-lg font-bold text-text">{weekly?.challenges ?? 0}</p><p className="text-[10px] text-text-muted">Challenges</p></div></div><p className="mt-3 rounded-card bg-primary/5 p-3 text-sm text-text-muted">{weekly ? `This week you logged ${weekly.checkins} check-in${weekly.checkins === 1 ? "" : "s"}, ${weekly.appreciations} appreciation${weekly.appreciations === 1 ? "" : "s"}, ${weekly.dates} date${weekly.dates === 1 ? "" : "s"}, and completed ${weekly.challenges} challenge${weekly.challenges === 1 ? "" : "s"}. Keep showing up for each other.` : "Your weekly relationship summary will appear as you build activity together."}</p></Card>

      {badges.length > 0 && <Card><div className="mb-3 flex items-center gap-2"><Trophy className="h-5 w-5 text-primary" /><h2 className="font-semibold text-text">Your badges</h2></div><div className="flex flex-wrap gap-2">{badges.map((b: any) => <Badge key={b.id} tone="neutral">{b.couple_badges?.icon} {b.couple_badges?.name}</Badge>)}</div></Card>}

      <div className="grid grid-cols-2 gap-3"><Card padding="sm"><Calendar className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-text-muted">Dates logged</p><p className="text-xl font-bold text-text">{stats?.dates ?? 0}</p>{stats?.averageRating && <p className="text-xs text-text-muted">★ {stats.averageRating.toFixed(1)} avg</p>}</Card><Card padding="sm"><BarChart3 className="mb-2 h-4 w-4 text-primary" /><p className="text-xs text-text-muted">Weekly activity</p><p className="text-xl font-bold text-text">{(stats?.checkins ?? 0) + (stats?.appreciations ?? 0)}</p><p className="text-xs text-text-muted">check-ins + appreciation</p></Card></div>
      <Button variant="outline" icon={<Clock3 className="h-4 w-4" />} onClick={() => navigate('/couple/memories')}>View date history & timeline</Button>

      <button onClick={() => setDisconnectOpen(true)} className="flex w-full items-center justify-center gap-1.5 py-3 text-sm font-medium text-danger"><Unlink className="h-4 w-4" /> Disconnect</button>
      <Dialog open={disconnectOpen} onClose={() => setDisconnectOpen(false)} onConfirm={handleDisconnect} title="Disconnect from your partner?" description="This ends your relationship connection in Ellara. Your individual health data stays private and untouched." confirmLabel="Disconnect" tone="danger" loading={disconnecting} />
    </div>
  );
}

function BellIcon() { return <Clock3 className="h-5 w-5 text-primary" />; }
