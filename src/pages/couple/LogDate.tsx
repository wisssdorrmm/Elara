import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useRelationship } from '@/hooks/useRelationship';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import { notify } from '@/utils/toast';
import { cn } from '@/utils/cn';

export default function LogDate() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { relationship } = useRelationship();

  const [title, setTitle] = useState('');
  const [dateOn, setDateOn] = useState(new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user || !relationship || !title.trim()) return;
    setSaving(true);
    const { error } = await coupleEngagementService.logDate(relationship.id, user.id, {
      title: title.trim(),
      date_on: dateOn,
      location: location || null,
      rating,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      notify.error(error);
      return;
    }
    notify.success('Date logged');
    navigate('/couple');
  };

  return (
    <div>
      <Navbar title="Log a Date" showBack />
      <div className="app-page space-y-4 pt-0">
        <Input label="Title" placeholder="e.g. Dinner at our favorite spot" value={title} onChange={(e) => setTitle(e.target.value)} />
        <Input label="Date" type="date" value={dateOn} onChange={(e) => setDateOn(e.target.value)} />
        <Input label="Location (optional)" placeholder="e.g. Downtown" value={location} onChange={(e) => setLocation(e.target.value)} />

        <div>
          <p className="mb-1.5 text-sm font-medium text-text">Rating (optional)</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => setRating(rating === n ? null : n)} aria-label={`Rate ${n} stars`}>
                <Star className={cn('h-7 w-7', rating !== null && n <= rating ? 'fill-warning text-warning' : 'text-gray-300')} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-text">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What made it memorable?"
            rows={3}
            className="w-full rounded-input border border-gray-200 bg-white px-4 py-3.5 text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button disabled={!title.trim()} loading={saving} onClick={handleSave}>
          Save Date
        </Button>
      </div>
    </div>
  );
}
