// src/app/app/quiz/macro/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import macroQuestions from "@/app/data/macroQuestions.json";
import type { Answer } from "@/app/types/quiz";
import ProgressBar from "@/app/components/ProgressBar";
import { useAuth } from "@/app/providers/AuthProvider";
import { ensureDraft, saveSection } from "@/app/lib/drafts";
import QuizOptionGrid from "@/app/components/QuizOptionGrid"; // extract yours into components if needed

interface MacroQuestion { id: string; text: string; scale: string[]; dimension: string; }

export default function MacroPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get("rid") || undefined;

  const { user, loading } = useAuth();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [prefillLoading, setPrefillLoading] = useState<boolean>(!!ridParam);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/app/quiz/macro");
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
          `/api/quiz/section?rid=${encodeURIComponent(ridParam)}&section=macro`,
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

  if (loading || !user) return null;

  const all = macroQuestions as MacroQuestion[];
  const allAnswered = all.every(q => answers.some(a => a.questionId === q.id));

  const onSelect = (questionId: string, score: number) => {
    setAnswers(prev => {
      const i = prev.findIndex(a => a.questionId === questionId);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], score };
        return next;
      }
      return [...prev, { questionId, score }];
    });
  };

  const onNext = async () => {
    if (!allAnswered) return;
    const { id: rid } = await ensureDraft(user!, ridParam);
    await saveSection(user!, rid, "macro", answers, "macro_done");
    router.push(`/app`); // ← return to dashboard after saving
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <ProgressBar
          value={all.length ? answers.length / all.length : 0}
          label="Part 1 of 2"
        />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-4">Big picture</h2>

      {prefillLoading && (
        <div className="mb-4 text-sm text-gray-600">Loading your previous answers…</div>
      )}
      {prefillError && (
        <div className="mb-4 text-sm text-red-600">{prefillError}</div>
      )}

      {all.map(q => {
        const sel = answers.find(a => a.questionId === q.id)?.score;
        return (
          <QuizOptionGrid key={q.id} question={q} selected={sel} onSelect={onSelect} />
        );
      })}

      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          disabled={!allAnswered}
          className="btn btn-primary disabled:opacity-50"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
}