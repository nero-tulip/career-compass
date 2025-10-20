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

function hash32(s: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  const skipIntroParam = sp.get('skipIntro') === '1';

  const { user, loading } = useAuth();
  const cfg = big5Config as Big5Config;

  const [rid, setRid] = useState<string | undefined>(ridParam);
  const [answers, setAnswers] = useState<Answer[]>([]);
  // Intro step = -1 (starts at questions after Start)
  const [page, setPage] = useState<number>(skipIntroParam ? 0 : -1);
  const [busy, setBusy] = useState(false);

  // Auth gate
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/app/quiz/big5');
  }, [loading, user, router]);

  // Ensure draft (if rid present we’ll still ensure) + prefill prior answers
  useEffect(() => {
    let alive = true;
    (async () => {
      if (loading || !user) return;
      try {
        // If user came via dashboard “Start” for the first time, rid may not exist yet.
        // We *don’t* ensure draft here if we’re on intro; we’ll ensure on Start.
        if (page < 0 && !ridParam) return;

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
  }, [loading, user, ridParam, page]);

  // Smooth scroll to top on page change (ignore intro)
  useEffect(() => {
    if (typeof window !== 'undefined' && page >= 0) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page]);

  if (loading || !user) return null;

  // Deterministically shuffle questions once rid is known; otherwise fallback to original order temporarily
  const all = useMemo(() => {
    const items = cfg.items;
    return rid ? shuffleDeterministic(items, rid) : items;
  }, [cfg.items, rid]);

  // Pagination math
  const start = Math.max(0, page) * QUESTIONS_PER_PAGE;
  const pageQs = page >= 0 ? all.slice(start, start + QUESTIONS_PER_PAGE) : [];
  const isLast = page >= 0 && start + QUESTIONS_PER_PAGE >= all.length;
  const totalPages = Math.ceil(all.length / QUESTIONS_PER_PAGE);

  // Progress: on intro, show 0%
  const progress = useMemo(
    () =>
      page < 0
        ? 0
        : (page * QUESTIONS_PER_PAGE +
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

  const allOnPageAnswered =
    page >= 0 ? pageQs.every((q) => answers.some((a) => a.questionId === q.id)) : false;

  // Intro → Start
  const startQuiz = async () => {
    const { id: ensuredRid } = await ensureDraft(user!, rid);
    setRid(ensuredRid);

    // (Optional) mark intro seen
    await saveSection(user!, ensuredRid, 'big5', answers, 'big5_intro_seen' as any, {
      progress: { section: 'big5', page: 0 },
    } as any);

    setPage(0);
  };

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
    if (page < 0) return startQuiz();
    if (!allOnPageAnswered || busy) return;
    try {
      setBusy(true);

      if (!isLast) {
        await persistPage('big5_in_progress');
        setPage((p) => p + 1);
        return;
      }

      // Final submit: save + (best-effort) compute section, then redirect to results
      const finalRid = await persistPage('big5_done');

      try {
        const token = await user!.getIdToken();
        await fetch('/api/results/section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ rid: finalRid, section: 'big5', mode: 'final' }),
        });
      } catch (err) {
        console.warn('Big5 compute on finalize failed (lazy compute on GET will handle):', err);
      }

      router.push(`/app/results/big5?rid=${encodeURIComponent(finalRid)}`);
    } finally {
      setBusy(false);
    }
  };

  const back = async () => {
    if (page <= 0 || busy) return;
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
        <ProgressBar
          value={progress}
          label={page < 0 ? 'Intro' : `Big Five • Page ${page + 1} of ${totalPages}`}
        />
      </div>

      {/* ---------------- Intro Step ---------------- */}
      {page < 0 ? (
        <div className="space-y-6">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              {cfg.meta.title || 'Big Five Personality'}
            </h1>
            <p className="text-gray-600">
              {cfg.meta.description ||
                'A well-validated framework describing five broad personality traits relevant to work and life.'}
            </p>
          </header>

          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">What this measures</h2>
            <p className="text-gray-700">
              The Big Five captures tendencies across five dimensions:
              <span className="font-medium"> Openness</span>,{' '}
              <span className="font-medium">Conscientiousness</span>,{' '}
              <span className="font-medium">Extraversion</span>,{' '}
              <span className="font-medium">Agreeableness</span>, and{' '}
              <span className="font-medium">Neuroticism</span>. It helps explain how you prefer to work,
              collaborate, make decisions, and respond to stress.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">How it works</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>You’ll rate statements from “Very Inaccurate” to “Very Accurate”.</li>
              <li>Some items are reverse-scored automatically — just answer honestly.</li>
              <li>There are no right or wrong answers; be descriptive, not aspirational.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-1">Estimated time: ~8–12 minutes.</p>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">Tips for accurate results</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Answer based on typical behavior over the last year.</li>
              <li>If unsure, pick the option that fits you most of the time.</li>
              <li>Trust your first instinct; don’t overthink.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-1">
              Your responses are used to personalize your report and recommendations.
            </p>
          </section>

          <div className="flex items-center justify-between">
            <button className="btn btn-ghost" onClick={() => router.push('/app')}>
              Back to dashboard
            </button>
            <button onClick={startQuiz} className="btn btn-primary">
              Start Big Five
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- Quiz Pages ---------------- */
        <>
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
        </>
      )}
    </div>
  );
}