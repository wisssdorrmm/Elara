import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types';

type Period = Database['public']['Tables']['periods']['Row'];

export default function History() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('periods')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false })
      .then(({ data }) => {
        setPeriods(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-text">History</h1>

      {periods.length === 0 ? (
        <EmptyState icon={Clock} title="No cycles logged yet" description="Your past cycles will show up here once you start tracking." />
      ) : (
        <div className="space-y-3">
          {periods.map((period) => (
            <Card key={period.id} interactive onClick={() => navigate(`/history/${period.id}`)} role="button">
              <p className="font-semibold text-text">
                {new Date(period.start_date).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-sm text-text-muted">
                Started {new Date(period.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                {period.end_date && ` – ${new Date(period.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
