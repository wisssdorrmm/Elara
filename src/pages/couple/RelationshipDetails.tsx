import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleService } from '@/services/coupleService';
import { notify } from '@/utils/toast';

export default function RelationshipDetails() {
  const navigate = useNavigate();
  const { relationship, loading, error, refetch } = useRelationship();
  const [saving, setSaving] = useState(false);

  const [nickname, setNickname] = useState('');
  const [startedAt, setStartedAt] = useState('');
  const [anniversaryDate, setAnniversaryDate] = useState('');
  const [firstDateAt, setFirstDateAt] = useState('');

  useEffect(() => {
    if (!relationship) return;
    setNickname(relationship.nickname ?? '');
    setStartedAt(relationship.started_at);
    setAnniversaryDate(relationship.anniversary_date ?? '');
    setFirstDateAt(relationship.first_date_at ?? '');
  }, [relationship]);

  const handleSave = async () => {
    if (!relationship) return;
    setSaving(true);
    const { error: saveError } = await coupleService.updateRelationship(relationship.id, {
      nickname: nickname || null,
      started_at: startedAt,
      anniversary_date: anniversaryDate || null,
      first_date_at: firstDateAt || null,
    });
    setSaving(false);
    if (saveError) {
      notify.error(saveError);
      return;
    }
    notify.success('Relationship details updated');
    navigate('/couple/dashboard');
  };

  if (loading) return <Loading fullScreen />;
  if (error) return <ErrorState message="We couldn't load your relationship." onRetry={refetch} />;
  if (!relationship) return <ErrorState message="You're not connected with a partner yet." />;

  return (
    <div>
      <Navbar showBack title="Relationship Details" />
      <div className="app-page space-y-5 pt-0">
        <Input
          label="Relationship nickname"
          placeholder="e.g. Us, Team Smith..."
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <Input label="Relationship start date" type="date" value={startedAt} onChange={(e) => setStartedAt(e.target.value)} />
        <Input
          label="Anniversary"
          type="date"
          value={anniversaryDate}
          onChange={(e) => setAnniversaryDate(e.target.value)}
        />
        <Input
          label="First date (optional)"
          type="date"
          value={firstDateAt}
          onChange={(e) => setFirstDateAt(e.target.value)}
        />

        <Button loading={saving} onClick={handleSave}>
          Save
        </Button>
        <Button variant="outline" onClick={() => navigate('/couple/dashboard')}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
