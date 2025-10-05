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

/* ------------------------ Deterministic shuffle helpers ------------------------ */

// Simple 32-bit string hash → number seed
function hash32(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Mulberry32 PRNG
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher–Yates with injected RNG (stable given same seed)
function shuffleDeterministic<T>(arr: T[], seedStr: string): T[] {
  const out = arr.slice();
  const rand = mulberry32(hash32(seedStr || 'fallback-seed'));
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/* ------------------------------------------------------------------------------ */

export default function Big5Page() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get('rid') || undefined;

  const { user, loading } = useAuth();
  const cfg = big5Config as Big5Config;

  const [rid, setRid] = useState<string | undefined>(ridParam);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/app/quiz/big5');
  }, [loading, user, router]);

  // Ensure draft + prefill from draft (if previously answered)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (loading || !user) return;
      try {
        const { id: ensuredRid } = await ensureDraft(user, ridParam);
        if (!alive) return;
        setRid(ensuredRid);

        const existing = (await loadSection(user, ensuredRid, 'big5')) as
          | Answer[]
          | null
          | undefined;
        if (!alive) return;
        if (Array.isArray(existing) && existing.length) {
          setAnswers(existing);
        }
      } catch (e) {
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

  // Deterministically shuffle questions once rid is known; otherwise fallback to original order briefly
  const all = useMemo(() => {
    const items = cfg.items;
    return rid ? shuffleDeterministic(items, rid) : items;
  }, [cfg.items, rid]);

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
    const { id: ensuredRid } = await ensureDraft(user!, rid);
    if (!rid) setRid(ensuredRid);
    await saveSection(user!, ensuredRid, 'big5', answers, asStatus, {
      progress: { section: 'big5', page: page + 1 },
    } as any);
    return ensuredRid;
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
      const finalRid = await persistPage('big5_done');

      try {
        const token = await user!.getIdToken();
        await fetch('/api/results/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ rid: finalRid, section: 'big5', mode: 'final' }),
        });
        // If compute fails, the results page will lazy-compute on GET
      } catch (err) {
        console.warn('Big5 compute on finalize failed (will lazy compute on GET):', err);
      }

      router.push(`/app/results/big5?rid=${encodeURIComponent(finalRid)}`);
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