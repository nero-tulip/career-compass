"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import riaQuestions from "@/app/data/riasecQuestionsShuffled.json";
import type { Answer } from "@/app/types/quiz";
import ProgressBar from "@/app/components/ProgressBar";
import QuizOptionGrid from "@/app/components/QuizOptionGrid"; // ensure this component is exported here
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

  // Gate: require auth
  useEffect(() => {
    if (!loading && !user) {
      router.replace("/start");
    }
  }, [loading, user, router]);

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

  async function postResultsPreview(rid: string) {
    // Call your results endpoint in "preview" mode so the server can
    // compute/refresh a rolling snapshot. Keep it cheap (skip long AI) server-side.
    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid, mode: "preview" }),
      });
    } catch {
      // swallow preview errors; not fatal for quiz progression
    }
  }

  const next = async () => {
    if (!allOnPageAnswered) return;

    // 1) Ensure draft and save cumulative answers so far
    const { id: rid } = await ensureDraft(user!, ridParam);
    await saveSection(
      user!,
      rid,
      "riasec",
      answers,
      `riasec_page_${page + 1}_saved`
    );

    // 2) Send a preview to the server on EVERY Next
    await postResultsPreview(rid);

    // 3) Advance or finalize
    if (!isLast) {
      setPage((p) => p + 1);
      return;
    }

    // Final page: do a final server compute (can use mode: "final")
    try {
      await fetch("/api/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rid, mode: "final" }),
      });
    } catch {
      // even if this fails, we still route; your results page can show an error state if needed
    }

    router.push(`/results?rid=${rid}`);
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
          {isLast ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}
