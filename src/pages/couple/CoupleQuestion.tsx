import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lock, Check, Sparkles, Bookmark } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { useCoupleQuestion } from '@/hooks/useCoupleQuestion';
import { useRelationship } from '@/hooks/useRelationship';
import { notify } from '@/utils/toast';
import { QUESTION_CATEGORY_LABELS } from '@/constants';

export default function CoupleQuestion() {
  const navigate = useNavigate();
  const { relationship, loading: relationshipLoading } = useRelationship();
  const { question, myAnswer, partnerAnswer, revealed, loading, error, refetch, submitAnswer, saveToMemory } =
    useCoupleQuestion();

  const [answer, setAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [savingMemory, setSavingMemory] = useState(false);
  const [savedToMemory, setSavedToMemory] = useState(false);

  if (relationshipLoading || loading) return <Loading fullScreen />;

  if (!relationship) {
    return (
      <div>
        <Navbar title="Couple Question" showBack />
        <div className="app-page pt-0">
          <EmptyState
            icon={Heart}
            title="Connect with your partner"
            description="Connect with your partner to start playing together."
            action={
              <Button onClick={() => navigate('/couple')} fullWidth={false} className="px-6">
                Connect
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message="We couldn't load today's question." onRetry={refetch} />;

  if (!question) {
    return (
      <div>
        <Navbar title="Couple Question" showBack />
        <div className="app-page pt-0">
          <EmptyState icon={Sparkles} title="No question available" description="Check back soon for a new question." />
        </div>
      </div>
    );
  }

  const categoryInfo = QUESTION_CATEGORY_LABELS[question.category] ?? { label: question.category, emoji: '💬' };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      notify.error('Please write an answer first.');
      return;
    }
    setSubmitting(true);
    const { error: submitError } = await submitAnswer(answer);
    setSubmitting(false);
    if (submitError) {
      notify.error(submitError);
      return;
    }
    notify.success('Answer saved 💕');
    setAnswer('');
  };

  const handleSaveToMemory = async () => {
    setSavingMemory(true);
    const { error: saveError } = await saveToMemory();
    setSavingMemory(false);
    if (saveError) {
      notify.error(saveError);
      return;
    }
    setSavedToMemory(true);
    notify.success('Saved to memories 💌');
  };

  return (
    <div>
      <Navbar title="Couple Question" showBack />
      <div className="app-page space-y-4 pt-0">
        <Card className="bg-gradient-to-br from-primary to-secondary text-white">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-lg">{categoryInfo.emoji}</span>
            <Badge tone="primary" className="!bg-white/15 !text-white">
              {categoryInfo.label}
            </Badge>
          </div>
          <p className="text-lg font-semibold leading-snug">{question.question}</p>
        </Card>

        {!myAnswer && (
          <Card>
            <label htmlFor="answer" className="mb-1.5 block text-sm font-medium text-text">
              Your answer
            </label>
            <textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={4}
              maxLength={1000}
              className="w-full rounded-input border border-gray-200 bg-white px-4 py-3.5 text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <p className="mt-1 text-right text-xs text-text-muted">{answer.length}/1000</p>
            <Button loading={submitting} onClick={handleSubmit} className="mt-2">
              Submit Answer
            </Button>
          </Card>
        )}

        {myAnswer && !revealed && (
          <Card className="text-center">
            <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
              <Check className="h-6 w-6 text-success" />
            </span>
            <p className="mb-1 font-semibold text-text">Answer saved 💕</p>
            <p className="mb-4 text-sm text-text-muted">Your answer is locked until your partner answers.</p>
            <div className="mb-4 flex items-center justify-center gap-2 text-sm text-text-muted">
              <Lock className="h-4 w-4" />
              <span>Waiting for your partner...</span>
            </div>
            <Button variant="outline" fullWidth={false} className="px-4" onClick={() => setAnswer(myAnswer.answer)}>
              Edit Answer
            </Button>
          </Card>
        )}

        {myAnswer && !revealed && (
          <Card>
            <label htmlFor="edit-answer" className="mb-1.5 block text-sm font-medium text-text">
              Edit your answer
            </label>
            <textarea
              id="edit-answer"
              value={answer || myAnswer.answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-input border border-gray-200 bg-white px-4 py-3.5 text-base placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <Button loading={submitting} onClick={handleSubmit} className="mt-2">
              Save Changes
            </Button>
          </Card>
        )}

        {revealed && myAnswer && partnerAnswer && (
          <Card>
            <div className="mb-4 text-center">
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </span>
              <p className="text-lg font-bold text-text">🎉 You both answered!</p>
            </div>

            <div className="mb-4 rounded-card bg-primary/5 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Your answer</p>
              <p className="text-text">{myAnswer.answer}</p>
            </div>

            <div className="rounded-card bg-accent/10 p-4">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Your partner's answer</p>
              <p className="text-text">{partnerAnswer.answer}</p>
            </div>

            {!savedToMemory ? (
              <Button
                icon={<Bookmark className="h-4 w-4" />}
                loading={savingMemory}
                onClick={handleSaveToMemory}
                className="mt-4"
              >
                Save to Memories
              </Button>
            ) : (
              <p className="mt-4 text-center text-sm font-medium text-success">Saved to memories 💌</p>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}