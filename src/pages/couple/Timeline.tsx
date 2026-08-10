import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Heart, Calendar, Plane, Cake, Gem, Trophy, Camera, Gift, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import type { Database, TimelineEventType } from '@/types';

type TimelineEntry = Database['public']['Tables']['relationship_timeline']['Row'];

const EVENT_ICONS: Record<TimelineEventType, typeof Heart> = {
  started_dating: Heart,
  first_date: Calendar,
  trip: Plane,
  birthday: Cake,
  anniversary: Gem,
  milestone: Trophy,
  memory: Camera,
  challenge_completed: Gift,
  other: Sparkles,
};

export default function Timeline() {
  const { relationship, loading: relationshipLoading } = useRelationship();
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!relationship) return;
    setLoading(true);
    const { data, error: fetchError } = await coupleEngagementService.getTimeline(relationship.id);
    if (fetchError) setError(fetchError);
    else setEntries(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (relationship) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationship?.id]);

  return (
    <div>
      <Navbar title="Timeline" showBack />
      <div className="app-page pt-0">
        {relationshipLoading || loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message="We couldn't load your timeline." onRetry={load} />
        ) : entries.length === 0 ? (
          <EmptyState icon={Sparkles} title="No timeline entries yet" description="Log dates and milestones together to build your story." />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const Icon = EVENT_ICONS[entry.event_type];
              return (
                <Card key={entry.id} padding="sm">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-text">{entry.title}</p>
                      <p className="text-xs text-text-muted">{format(new Date(entry.event_date), 'MMM d, yyyy')}</p>
                      {entry.description && <p className="mt-1 text-sm text-text-muted">{entry.description}</p>}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
