// src/app/app/quiz/big5/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { ensureDraft, saveSection } from '@/app/lib/drafts';
import type { Big5Item, Big5Answer } from '@/app/types/big5';

// ⬅️ New path per your note
import big5Data from '@/app/data/big5Questions.json';

const PER_PAGE = 10;

export default function Big5QuizPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get('rid') || undefined;

  const { user, loading } = useAuth();

  const items = useMemo(() => (big5Data.items as Big5Item[]), []);
  const totalPages = Math.ceil(items.length / PER_PAGE);

  const [rid, setRid] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Big5Answer[]>([]);
  const [busy, setBusy] = useState(false);

  // Require auth
  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/app/quiz/big5');
  }, [loading, user, router]);

  // Init: ensure draft only (no /api/quiz/entry prefill yet)
  useEffect(() => {
    if (!user) return;
    let alive = true;

    (async () => {
      try {
        setBusy(true);
        const { id } = await ensureDraft(user, ridParam);
        if (!alive) return;
        setRid(id);

        // (Optional) If you want immediate prefill later, read from your drafts collection here
        // using your client Firestore helpers, or wait until we wire /api/quiz/entry to return it.
      } finally {
        if (!alive) return;
        setBusy(false);
      }
    })();

    return () => { alive = false; };
  }, [user, ridParam]);

  if (loading || !user) return null;

  // Page window
  const start = page * PER_PAGE;
  const pageItems = items.slice(start, start + PER_PAGE);
  const allOnPageAnswered = pageItems.every(it => answers.some(a => a.itemId === it.id));

  const setAnswer = (itemId: string, value: number) => {
    setAnswers(prev => {
      const i = prev.findIndex(a => a.itemId === itemId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], value };
        return next;
      }
      return [...prev, { itemId, value }];
    });
  };

  const nextPage = async () => {
    if (!rid || !allOnPageAnswered) return;
    setBusy(true);
    try {
      // Save current progress (in-progress)
      await saveSection(user, rid, 'big5', answers, 'big5_in_progress', {
        progress: { section: 'big5', page: page + 1 },
      } as any);
      if (page < totalPages - 1) {
        setPage(p => p + 1);
      } else {
        // Final submit → mark done and return to dashboard
        await saveSection(user, rid, 'big5', answers, 'big5_done');
        router.push('/app');
      }
    } finally {
      setBusy(false);
    }
  };

  const prevPage = async () => {
    if (page > 0) setPage(p => p - 1);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <header className="mb-6">
        <div className="text-sm text-gray-600">
          Page {page + 1} of {totalPages}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Big Five Personality Test</h1>
        <p className="muted">
          {big5Data.meta?.description || '100 statements that describe you. Indicate how accurately each describes you.'}
        </p>
      </header>

      <ol className="space-y-6">
        {pageItems.map((it, idx) => {
          const a = answers.find(x => x.itemId === it.id)?.value || 0;
          return (
            <li key={it.id} className="rounded-xl border p-4 bg-white">
              <div className="font-medium mb-2">
                {start + idx + 1}. {it.text}
              </div>
              <Likert
                value={a}
                onChange={(v) => setAnswer(it.id, v)}
                labels={big5Data.meta?.scaleLabels || defaultScale}
              />
            </li>
          );
        })}
      </ol>

      <div className="flex justify-between mt-8">
        <button onClick={prevPage} disabled={page === 0 || busy} className="btn btn-ghost disabled:opacity-50">
          Back
        </button>
        <button
          onClick={nextPage}
          disabled={!allOnPageAnswered || busy}
          className="btn btn-primary disabled:opacity-50"
        >
          {page < totalPages - 1 ? 'Next' : 'Submit'}
        </button>
      </div>
    </div>
  );
}

const defaultScale = [
  'Very Inaccurate',
  'Moderately Inaccurate',
  'Neither Inaccurate nor Accurate',
  'Moderately Accurate',
  'Very Accurate',
];

/** Simple 1..5 Likert */
function Likert({
  value,
  onChange,
  labels = defaultScale,
}: {
  value: number;
  onChange: (v: number) => void;
  labels?: string[];
}) {
  return (
    <div className="grid sm:grid-cols-5 gap-2">
      {([1,2,3,4,5] as const).map((v, i) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={[
              'w-full p-3 rounded-lg border text-sm',
              active ? 'bg-black text-white border-black' : 'bg-white hover:bg-gray-50',
            ].join(' ')}
            aria-pressed={active}
          >
            <div className="font-medium">{v}</div>
            <div className="text-[11px] text-gray-600 mt-1">{labels[i] || ''}</div>
          </button>
        );
      })}
    </div>
  );
}