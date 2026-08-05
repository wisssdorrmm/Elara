import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { periodService } from '@/services/periodService';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';
import { FLOW_OPTIONS } from '@/constants';
import type { FlowIntensity } from '@/types';

export default function EditPeriod() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [flow, setFlow] = useState<FlowIntensity | ''>('');

  useEffect(() => {
    if (!user || !id) return;
    periodService.getPeriodById(id, user.id).then(({ data }) => {
      if (data) {
        setStartDate(data.start_date);
        setEndDate(data.end_date ?? '');
        setFlow(data.flow ?? '');
      }
      setLoading(false);
    });
  }, [user, id]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await periodService.updatePeriod(id, {
      start_date: startDate,
      end_date: endDate || null,
      flow: flow || null,
    });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Cycle updated');
    navigate(`/history/${id}`);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Navbar showBack title="Edit Cycle" />
      <div className="app-page space-y-5 pt-0">
        <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-text">Flow</p>
          <div className="grid grid-cols-2 gap-2">
            {FLOW_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFlow(value)}
                className={cn(
                  'rounded-button border py-3 text-sm font-medium',
                  flow === value ? 'border-primary bg-primary text-white' : 'border-gray-200 bg-white text-text'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button loading={saving} onClick={handleSave}>
          Save Changes
        </Button>
        <Button variant="outline" onClick={() => navigate(`/history/${id}`)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
