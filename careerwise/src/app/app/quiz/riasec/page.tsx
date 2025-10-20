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
  const skipIntroParam = sp.get("skipIntro") === "1";

  const { user, loading } = useAuth();

  // Answers + paging
  const [answers, setAnswers] = useState<Answer[]>([]);
  // Intro is page = -1 (so paging starts at 0 after Start)
  const [page, setPage] = useState<number>(skipIntroParam ? 0 : -1);

  // Keep a local rid we can set after ensureDraft on Start
  const [rid, setRid] = useState<string | undefined>(ridParam);

  // Prefill state
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

  // Scroll to top on page change (ignore intro)
  useEffect(() => {
    if (typeof window !== "undefined" && page >= 0) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [page]);

  if (loading || !user) return null;

  const all = riaQuestions as RiaQ[];
  const totalPages = Math.ceil(all.length / QUESTIONS_PER_PAGE);

  // Compute page slice only when in question pages
  const start = Math.max(0, page) * QUESTIONS_PER_PAGE;
  const pageQs = page >= 0 ? all.slice(start, start + QUESTIONS_PER_PAGE) : [];
  const isLast = page >= 0 && start + QUESTIONS_PER_PAGE >= all.length;

  // Progress: on intro, show 0%
  const progress = useMemo(() => {
    if (page < 0) return 0;
    const answeredOnPage = pageQs.filter((q) =>
      answers.some((a) => a.questionId === q.id)
    ).length;
    return (
      (page * QUESTIONS_PER_PAGE + answeredOnPage) / (all.length || 1)
    );
  }, [page, pageQs, answers, all.length]);

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

  const allOnPageAnswered =
    page >= 0 ? pageQs.every((q) => answers.some((a) => a.questionId === q.id)) : false;

  // ---- Intro handlers ----
  const startQuiz = async () => {
    // Ensure a draft exists so we have a concrete rid for saves
    const { id } = await ensureDraft(user!, rid);
    setRid(id);

    // Optional: mark that intro was viewed
    await saveSection(user!, id, "riasec", answers, "riasec_intro_seen" as any, {
      progress: { section: "riasec", page: 0 },
    } as any);

    setPage(0);
  };

  // ---- Paging handlers ----
  const next = async () => {
    if (page < 0) return startQuiz();
    if (!allOnPageAnswered) return;

    const { id } = await ensureDraft(user!, rid);
    setRid(id);

    const status = isLast ? "riasec_done" : "riasec_in_progress";
    await saveSection(user!, id, "riasec", answers, status, {
      progress: { section: "riasec", page: page + 1 },
    } as any);

    if (!isLast) {
      setPage((p) => p + 1);
      return;
    }

    router.push(`/app/results/riasec?rid=${id}`);
  };

  const back = () => {
    if (page > 0) setPage((p) => p - 1);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Progress only when in the quiz pages */}
      <div className="mb-6">
        <ProgressBar
          value={progress}
          label={page < 0 ? "Intro" : `Page ${page + 1} of ${totalPages}`}
        />
      </div>

      {/* ---------------- Intro Step ---------------- */}
      {page < 0 ? (
        <div className="space-y-6">
          <header className="text-center space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">RIASEC Interests</h1>
            <p className="text-gray-600">
              A quick assessment of the kinds of work activities that naturally energize you.
            </p>
          </header>

          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-xl font-semibold">What this measures</h2>
            <p className="text-gray-700">
              RIASEC (Holland’s model) maps interests across six themes:
              <span className="font-medium"> Realistic, Investigative, Artistic, Social, Enterprising,</span> and
              <span className="font-medium"> Conventional</span>. It doesn’t box you in — it highlights environments and tasks where your motivation tends to rise.
            </p>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">How it works</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Read each statement and select how accurately it describes you.</li>
              <li>There are no right or wrong answers — be honest, not idealized.</li>
              <li>Your top 2–3 themes help guide roles, teams, and environments.</li>
            </ul>
          </section>

          <section className="rounded-2xl border bg-white p-6 shadow-sm space-y-3">
            <h2 className="text-xl font-semibold">Tips for accurate results</h2>
            <ul className="list-disc pl-5 text-gray-700 space-y-1">
              <li>Answer based on what energizes you <em>today</em>, not what you wish were true.</li>
              <li>If you’re unsure, pick the option you’d choose most of the time.</li>
              <li>Move steadily — first instincts are usually best.</li>
            </ul>
            <p className="text-xs text-gray-500 mt-1">Estimated time: ~5–7 minutes.</p>
          </section>

          <div className="flex items-center justify-between">
            <button
              className="btn btn-ghost"
              onClick={() => router.push("/app")}
            >
              Back to dashboard
            </button>
            <button
              onClick={startQuiz}
              className="btn btn-primary"
            >
              Start RIASEC
            </button>
          </div>
        </div>
      ) : (
        /* ---------------- Quiz Pages ---------------- */
        <>
          <h2 className="text-2xl font-semibold tracking-tight mb-4">
            RIASEC Interests
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
        </>
      )}
    </div>
  );
}