import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { useAuth } from '@/hooks/useAuth';
import { periodService } from '@/services/periodService';
import { notify } from '@/utils/toast';

export default function EditPeriod() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user || !id) return;
    periodService.getPeriodById(id, user.id).then(({ data }) => {
      if (data) {
        setStartDate(data.start_date);
        setEndDate(data.end_date ?? '');
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
    });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Period updated');
    navigate(`/history/${id}`);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div>
      <Navbar showBack title="Edit Period" />
      <div className="app-page space-y-5 pt-0">
        <Input label="Start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="End date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

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
