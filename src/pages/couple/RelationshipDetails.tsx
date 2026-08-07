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

  const [startDate, setStartDate] = useState('');
  const [anniversary, setAnniversary] = useState('');
  const [partnerBirthday, setPartnerBirthday] = useState('');
  const [firstDate, setFirstDate] = useState('');

  useEffect(() => {
    if (!relationship) return;
    setStartDate(relationship.relationship_start_date);
    setAnniversary(relationship.anniversary ?? '');
    setPartnerBirthday(relationship.partner_birthday ?? '');
    setFirstDate(relationship.first_date ?? '');
  }, [relationship]);

  const handleSave = async () => {
    if (!relationship) return;
    setSaving(true);
    const { error: saveError } = await coupleService.updateRelationship(relationship.id, {
      relationship_start_date: startDate,
      anniversary: anniversary || null,
      partner_birthday: partnerBirthday || null,
      first_date: firstDate || null,
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
        <Input label="Relationship start date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <Input label="Anniversary" type="date" value={anniversary} onChange={(e) => setAnniversary(e.target.value)} />
        <Input
          label="Partner's birthday"
          type="date"
          value={partnerBirthday}
          onChange={(e) => setPartnerBirthday(e.target.value)}
        />
        <Input label="First date (optional)" type="date" value={firstDate} onChange={(e) => setFirstDate(e.target.value)} />

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
