import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, format } from 'date-fns';
import { Droplets, Smile, Activity, FileText, Pencil, Trash2 } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { Dialog } from '@/components/ui/Dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { notify } from '@/utils/toast';
import type { Database } from '@/types';

type Period = Database['public']['Tables']['periods']['Row'];
type Log = Database['public']['Tables']['logs']['Row'];

export default function CycleDetails() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [period, setPeriod] = useState<Period | null>(null);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user || !id) return;

    const load = async () => {
      const { data: periodData } = await supabase.from('periods').select('*').eq('id', id).eq('user_id', user.id).single();
      setPeriod(periodData ?? null);

      if (periodData) {
        const { data: logData } = await supabase
          .from('logs')
          .select('*')
          .eq('user_id', user.id)
          .gte('log_date', periodData.start_date)
          .lte('log_date', periodData.end_date ?? periodData.start_date)
          .order('log_date', { ascending: true });
        setLogs(logData ?? []);
      }
      setLoading(false);
    };

    load();
  }, [user, id]);

  const handleDelete = async () => {
    if (!period) return;
    setDeleting(true);
    const { error } = await supabase.from('periods').delete().eq('id', period.id);
    setDeleting(false);
    if (error) {
      notify.error(error.message);
      return;
    }
    notify.success('Cycle deleted');
    navigate('/history');
  };

  if (loading) return <Loading fullScreen />;

  if (!period) {
    return (
      <div>
        <Navbar showBack title="Cycle" />
        <div className="app-page pt-0">
          <p className="text-text-muted">This cycle couldn&apos;t be found.</p>
        </div>
      </div>
    );
  }

  const length = period.end_date
    ? differenceInCalendarDays(new Date(period.end_date), new Date(period.start_date)) + 1
    : null;

  return (
    <div>
      <Navbar
        showBack
        title={format(new Date(period.start_date), 'MMM d')}
        right={
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigate(`/history/${period.id}/edit`)}
              aria-label="Edit"
              className="rounded-full p-2 text-text-muted hover:bg-black/5"
            >
              <Pencil className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              aria-label="Delete"
              className="rounded-full p-2 text-danger hover:bg-danger/10"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          </div>
        }
      />

      <div className="app-page space-y-4 pt-0">
        <Card>
          <p className="text-sm text-text-muted">
            {format(new Date(period.start_date), 'MMM d')}
            {period.end_date && ` – ${format(new Date(period.end_date), 'MMM d, yyyy')}`}
          </p>
          <div className="mt-2 flex items-center gap-2">
            {length && <Badge tone="primary">{length} day period</Badge>}
            {period.flow && <Badge tone="danger">{period.flow.replace('_', ' ')} flow</Badge>}
          </div>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-text">
            <Droplets className="h-4 w-4 text-danger" />
            <p className="font-semibold">Flow</p>
          </div>
          <p className="text-sm text-text-muted">{period.flow ? period.flow.replace('_', ' ') : 'Not logged'}</p>
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-text">
            <Smile className="h-4 w-4 text-primary" />
            <p className="font-semibold">Mood</p>
          </div>
          {logs.some((l) => l.mood) ? (
            <div className="flex flex-wrap gap-2">
              {logs.filter((l) => l.mood).map((l) => (
                <Badge key={l.id} tone="primary">
                  {l.mood}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">Not logged</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-text">
            <Activity className="h-4 w-4 text-warning" />
            <p className="font-semibold">Symptoms</p>
          </div>
          {logs.some((l) => l.symptoms?.length) ? (
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(logs.flatMap((l) => l.symptoms ?? []))).map((s) => (
                <Badge key={s} tone="warning">
                  {s}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No symptoms logged</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center gap-2 text-text">
            <FileText className="h-4 w-4 text-text-muted" />
            <p className="font-semibold">Notes</p>
          </div>
          {logs.some((l) => l.notes) ? (
            <div className="space-y-2">
              {logs.filter((l) => l.notes).map((l) => (
                <p key={l.id} className="text-sm text-text-muted">
                  <span className="font-medium text-text">{format(new Date(l.log_date), 'MMM d')}: </span>
                  {l.notes}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted">No notes</p>
          )}
        </Card>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete this cycle?"
        description="This will permanently remove this period entry. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
      />
    </div>
  );
}
