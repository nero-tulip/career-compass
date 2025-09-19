"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import riaQuestions from "@/app/data/riasecQuestionsShuffled.json";
import type { Answer } from "@/app/types/quiz";
import ProgressBar from "@/app/components/ProgressBar";
import QuizOptionGrid from "@/app/components/QuizOptionGrid";
import { useAuth } from "@/app/providers/AuthProvider";
import { ensureDraft, saveSection } from "@/app/lib/drafts";
import { getAuth } from "firebase/auth";

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


  const next = async () => {
    if (!allOnPageAnswered) return;

    // 1) Ensure draft and save cumulative answers so far
    const { id: rid } = await ensureDraft(user!, ridParam);

    // Coarse statuses only: in-progress OR done on final page
    const status = isLast ? "riasec_done" : "riasec_in_progress";

    await saveSection(user!, rid, "riasec", answers, status, {
      progress: { section: "riasec", page: page + 1 },
    } as any); // extraData arg if your saveSection supports it; safe to omit if not

    // 3) Advance or finalize
    if (!isLast) {
      setPage((p) => p + 1);
      return;
    }

    // Final page: call results API (server/Admin SDK will read the draft by uid+rid)
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) {
        console.error("Missing ID token for results submission");
        return;
      }

      const res = await fetch("/api/results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ rid, mode: "final" }),
      });

      if (!res.ok) {
        console.error("Results API failed", await res.text());
        // You can show a toast here
        return;
      }
    } catch (e) {
      console.error("Results API error", e);
      // You can show a toast here
      return;
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