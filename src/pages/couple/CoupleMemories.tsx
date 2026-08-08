import { useEffect, useState } from 'react';
import { CalendarDays, Clock3, Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { Navbar } from '@/components/layout/Navbar';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleEngagementService } from '@/services/coupleEngagementService';

export default function CoupleMemories() {
  const { relationship, loading, error, refetch } = useRelationship();
  const [dates, setDates] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [busy, setBusy] = useState(true);
  useEffect(() => { if (!relationship) return; setBusy(true); Promise.all([coupleEngagementService.getDates(relationship.id), coupleEngagementService.getTimeline(relationship.id)]).then(([d,t]) => { setDates(d.data ?? []); setTimeline(t.data ?? []); }).finally(() => setBusy(false)); }, [relationship?.id]);
  if (loading || busy) return <Loading fullScreen />;
  if (error) return <ErrorState message="We couldn't load your memories." onRetry={refetch} />;
  return <div><Navbar title="Your Memories" showBack /><div className="app-page space-y-5 pt-0"><section><div className="mb-3 flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><h2 className="font-semibold text-text">Date history</h2></div>{dates.length ? <div className="space-y-2">{dates.map(d => <Card key={d.id} padding="sm"><p className="font-semibold text-text">{d.title}</p><p className="text-xs text-text-muted">{d.date_on}{d.location ? ` · ${d.location}` : ''}{d.rating ? ` · ★ ${d.rating}/5` : ''}</p>{d.notes && <p className="mt-2 text-sm text-text-muted">{d.notes}</p>}</Card>)}</div> : <Card><p className="text-sm text-text-muted">No dates logged yet.</p></Card>}</section><section><div className="mb-3 flex items-center gap-2"><Clock3 className="h-5 w-5 text-primary" /><h2 className="font-semibold text-text">Relationship timeline</h2></div>{timeline.length ? <div className="space-y-2">{timeline.map(e => <Card key={e.id} padding="sm"><div className="flex gap-3"><span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10"><Heart className="h-4 w-4 text-primary" /></span><div><p className="font-semibold text-text">{e.title}</p><p className="text-xs text-text-muted">{e.event_date} · {e.event_type.replace('_',' ')}</p>{e.description && <p className="mt-1 text-sm text-text-muted">{e.description}</p>}</div></div></Card>)}</div> : <Card><p className="text-sm text-text-muted">Your timeline will grow as you add memories and milestones.</p></Card>}</section></div></div>;
}
