import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useRelationship } from './useRelationship';
import { coupleEngagementService } from '@/services/coupleEngagementService';
import type { Database } from '@/types/database';

type CoupleQuestion = Database['public']['Tables']['couple_questions']['Row'];
type CoupleQuestionAnswer = Database['public']['Tables']['couple_question_answers']['Row'];

export interface CoupleQuestionState {
  question: CoupleQuestion | null;
  myAnswer: CoupleQuestionAnswer | null;
  partnerAnswer: CoupleQuestionAnswer | null;
  /** True when both partners have answered (reveal condition met). */
  revealed: boolean;
  loading: boolean;
  error: string | null;
}

export function useCoupleQuestion() {
  const { user } = useAuth();
  const { relationship, loading: relationshipLoading } = useRelationship();
  const [question, setQuestion] = useState<CoupleQuestion | null>(null);
  const [myAnswer, setMyAnswer] = useState<CoupleQuestionAnswer | null>(null);
  const [partnerAnswer, setPartnerAnswer] = useState<CoupleQuestionAnswer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!user || !relationship) {
      setQuestion(null);
      setMyAnswer(null);
      setPartnerAnswer(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const { data: q, error: qError } = await coupleEngagementService.getTodayQuestion();
    if (qError) {
      setError(qError);
      setLoading(false);
      return;
    }
    setQuestion(q);

    // Fetch all answers for this question+relationship. RLS enforces the
    // reveal rule: the partner's answer is only returned once BOTH have
    // answered. We then split into "mine" vs "partner's" client-side.
    const { data: answers, error: aError } = await coupleEngagementService.getAnswers(q!.id, relationship.id);
    if (aError) {
      setError(aError);
      setLoading(false);
      return;
    }

    const mine = answers?.find((a) => a.user_id === user.id) ?? null;
    const partner = answers?.find((a) => a.user_id !== user.id) ?? null;
    setMyAnswer(mine);
    setPartnerAnswer(partner);
    setLoading(false);
  }, [user, relationship]);

  useEffect(() => {
    if (!relationshipLoading) refresh();
  }, [refresh, relationshipLoading]);

  const submitAnswer = useCallback(
    async (answer: string) => {
      if (!user || !relationship || !question) return { error: 'Not ready yet.' };
      const { data, error: submitError } = await coupleEngagementService.submitAnswer(
        question.id,
        relationship.id,
        user.id,
        answer
      );
      if (submitError) return { error: submitError };
      setMyAnswer(data);
      // After submitting, re-fetch to see if the partner's answer is now
      // revealed (they may have answered in the meantime).
      await refresh();
      return { error: null };
    },
    [user, relationship, question, refresh]
  );

  const saveToMemory = useCallback(async () => {
    if (!user || !relationship || !question || !myAnswer || !partnerAnswer) return { error: 'Not ready yet.' };
    const { data, error: saveError } = await coupleEngagementService.saveQuestionToMemory(
      relationship.id,
      user.id,
      question.question,
      myAnswer.answer,
      partnerAnswer.answer
    );
    if (saveError) return { error: saveError };
    return { data, error: null };
  }, [user, relationship, question, myAnswer, partnerAnswer]);

  return {
    question,
    myAnswer,
    partnerAnswer,
    revealed: !!myAnswer && !!partnerAnswer,
    loading: loading || relationshipLoading,
    error,
    refetch: refresh,
    submitAnswer,
    saveToMemory,
  };
}