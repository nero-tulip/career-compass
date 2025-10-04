// src/app/app/quiz/big5/page.tsx
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import ProgressBar from '@/app/components/ProgressBar';
import QuizOptionGrid from '@/app/components/QuizOptionGrid';
import big5Config from '@/app/data/big5Questions.json';
import { ensureDraft, saveSection, loadSection } from '@/app/lib/drafts';

type ScaleLabel = string;

type Big5Item = {
  id: string;            // e.g., "E1", "A2R"
  text: string;
  trait: 'E' | 'A' | 'C' | 'N' | 'O';
  reverse: boolean;
};

type Big5Config = {
  version: string;
  meta: {
    title: string;
    description: string;
    scaleLabels: ScaleLabel[]; // ["Very Inaccurate", ... , "Very Accurate"]
  };
  items: Big5Item[];
};

type Answer = { questionId: string; score: number };

const QUESTIONS_PER_PAGE = 10;

export default function Big5Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get('rid') || undefined;

  const { user, loading } = useAuth();
  const cfg = big5Config as Big5Config;

  const [answers, setAnswers] = useState<Answer[]>([]);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const all = cfg.items;

  // Auth gate
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/app/quiz/big5');
  }, [loading, user, router]);

  // Prefill from draft (if previously answered)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (loading || !user) return;
      try {
        const { id: rid } = await ensureDraft(user, ridParam);
        const existing = (await loadSection(user, rid, 'big5')) as Answer[] | null | undefined;
        if (!alive) return;
        if (Array.isArray(existing) && existing.length) {
          setAnswers(existing);
        }
      } catch (e) {
        // non-fatal; start blank
        console.warn('Big5 prefill failed:', e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loading, user, ridParam]);

  // Smooth scroll to top on page change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  if (loading || !user) return null;

  // Pagination math
  const start = page * QUESTIONS_PER_PAGE;
  const pageQs = all.slice(start, start + QUESTIONS_PER_PAGE);
  const isLast = start + QUESTIONS_PER_PAGE >= all.length;
  const totalPages = Math.ceil(all.length / QUESTIONS_PER_PAGE);

  const progress = useMemo(
    () =>
      (page * QUESTIONS_PER_PAGE +
        pageQs.filter((q) => answers.some((a) => a.questionId === q.id)).length) /
      (all.length || 1),
    [page, pageQs, answers, all.length]
  );

  // Answer handler
  const onSelect = (questionId: string, score1to5: number) => {
    setAnswers((prev) => {
      const i = prev.findIndex((a) => a.questionId === questionId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], score: score1to5 };
        return next;
      }
      return [...prev, { questionId, score: score1to5 }];
    });
  };

  const allOnPageAnswered = pageQs.every((q) =>
    answers.some((a) => a.questionId === q.id)
  );

  // Persist current answers (and optional status), return rid
  const persistPage = async (asStatus: 'big5_in_progress' | 'big5_done') => {
    const { id: rid } = await ensureDraft(user!, ridParam);
    await saveSection(user!, rid, 'big5', answers, asStatus, {
      progress: { section: 'big5', page: page + 1 },
    } as any);
    return rid;
  };

  const next = async () => {
    if (!allOnPageAnswered || busy) return;
    try {
      setBusy(true);

      if (!isLast) {
        await persistPage('big5_in_progress');
        setPage((p) => p + 1);
        return;
      }

      // Final submit: save + compute section result, then redirect to big5 results
      const rid = await persistPage('big5_done');

      try {
        const token = await user!.getIdToken();
        await fetch('/api/results/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ rid, section: 'big5', mode: 'final' }),
        });
        // If the compute fails, we'll still redirect—the GET page will lazy-compute
      } catch (err) {
        console.warn('Big5 compute on finalize failed (will lazy compute on GET):', err);
      }

      router.push(`/app/results/big5?rid=${encodeURIComponent(rid)}`);
    } finally {
      setBusy(false);
    }
  };

  const back = async () => {
    if (page === 0 || busy) return;
    try {
      setBusy(true);
      await persistPage('big5_in_progress');
      setPage((p) => p - 1);
    } finally {
      setBusy(false);
    }
  };

  // UI
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <ProgressBar value={progress} label={`Big Five • Page ${page + 1} of ${totalPages}`} />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-2">
        {cfg.meta.title || 'Big Five Personality Test'}
      </h2>
      {cfg.meta.description ? (
        <p className="muted mb-6">{cfg.meta.description}</p>
      ) : null}

      {pageQs.map((q) => {
        const sel = answers.find((a) => a.questionId === q.id)?.score;
        return (
          <QuizOptionGrid
            key={q.id}
            question={{ id: q.id, text: q.text, scale: cfg.meta.scaleLabels }}
            selected={sel}
            onSelect={(id, score) => onSelect(id, score)}
          />
        );
      })}

      <div className="flex justify-between mt-8">
        <button
          onClick={back}
          disabled={page === 0 || busy}
          className="btn btn-ghost disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!allOnPageAnswered || busy}
          className="btn btn-primary disabled:opacity-50"
        >
          {isLast ? (busy ? 'Finishing…' : 'Complete') : (busy ? 'Saving…' : 'Next')}
        </button>
      </div>
    </div>
  );
}