// src/app/app/quiz/riasec/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import riaQuestions from "@/app/data/riasecQuestionsShuffled.json";
import type { Answer } from "@/app/types/quiz";
import ProgressBar from "@/app/components/ProgressBar";
import QuizOptionGrid from "@/app/components/QuizOptionGrid";
import { useAuth } from "@/app/providers/AuthProvider";
import { ensureDraft, saveSection } from "@/app/lib/drafts";

interface RiaQ {
  id: string;
  text: string;
  scale: string[];
  category: string;
  style: string;
}

const QUESTIONS_PER_PAGE = 10;

export default function RIASECPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get("rid") || undefined;

  const { user, loading } = useAuth();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [page, setPage] = useState(0);

  // NEW: prefill state
  const [prefillLoading, setPrefillLoading] = useState<boolean>(!!ridParam);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  // Gate: require auth
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?next=/app/quiz/riasec");
    }
  }, [loading, user, router]);

  // Prefill from saved answers if rid is present
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!user || !ridParam) {
          if (active) setPrefillLoading(false);
          return;
        }
        const token = await user.getIdToken?.();
        const res = await fetch(
          `/api/quiz/section?rid=${encodeURIComponent(ridParam)}&section=riasec`,
          { headers: { Authorization: "Bearer " + token } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        const stored = Array.isArray(data?.data) ? (data.data as Answer[]) : [];
        if (active) setAnswers(stored);
      } catch (e: any) {
        if (active) setPrefillError(e?.message || "Failed to load your previous answers.");
      } finally {
        if (active) setPrefillLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user, ridParam]);

  // Scroll to top on page change
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  if (loading || !user) return null;

  const all = riaQuestions as RiaQ[];
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

  const onSelect = (questionId: string, score: number) => {
    setAnswers((prev) => {
      const i = prev.findIndex((a) => a.questionId === questionId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], score };
        return next;
      }
      return [...prev, { questionId, score }];
    });
  };

  const allOnPageAnswered = pageQs.every((q) =>
    answers.some((a) => a.questionId === q.id)
  );

  const next = async () => {
    if (!allOnPageAnswered) return;

    // 1) Ensure draft and save cumulative answers so far
    const { id: rid } = await ensureDraft(user!, ridParam);

    // Coarse statuses only: in-progress OR done on final page
    const status = isLast ? "riasec_done" : "riasec_in_progress";

    await saveSection(user!, rid, "riasec", answers, status, {
      progress: { section: "riasec", page: page + 1 },
    } as any);

    // 2) Advance or finalize
    if (!isLast) {
      setPage((p) => p + 1);
      return;
    }

    // FINAL: return to dashboard instead of computing results immediately
    router.push(`/app/results/riasec?rid=${rid}`);
  };

  const back = () => {
    if (page > 0) setPage((p) => p - 1);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <ProgressBar
          value={progress}
          label={`Part 2 of 2 • Page ${page + 1} of ${totalPages}`}
        />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-4">
        Career preferences
      </h2>

      {prefillLoading && (
        <div className="mb-4 text-sm text-gray-600">Loading your previous answers…</div>
      )}
      {prefillError && (
        <div className="mb-4 text-sm text-red-600">{prefillError}</div>
      )}

      {pageQs.map((q) => {
        const sel = answers.find((a) => a.questionId === q.id)?.score;
        return (
          <QuizOptionGrid
            key={q.id}
            question={q}
            selected={sel}
            onSelect={onSelect}
          />
        );
      })}

      <div className="flex justify-between mt-8">
        <button
          onClick={back}
          disabled={page === 0}
          className="btn btn-ghost disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={!allOnPageAnswered}
          className="btn btn-primary disabled:opacity-50"
        >
          {isLast ? "Complete" : "Next"}
        </button>
      </div>
    </div>
  );
}