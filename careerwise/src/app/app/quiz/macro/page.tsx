// src/app/app/quiz/macro/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import macroQuestions from "@/app/data/macroQuestions.json";
import ProgressBar from "@/app/components/ProgressBar";
import QuizOptionGrid from "@/app/components/QuizOptionGrid";
import { useAuth } from "@/app/providers/AuthProvider";
import { ensureDraft, saveSection } from "@/app/lib/drafts";
import { useRef } from "react";

// ----- Types -----
type QType = "likert" | "select" | "chips" | "textarea" | "country-multi";

type MacroQuestion = {
  id: string;
  text: string;
  dimension?: string;

  // Type controls which UI to render
  type?: QType;

  // Likert only
  scale?: string[];

  // Select / Chips
  options?: Array<{ value: string; label: string }>;

  // Textarea
  placeholder?: string;
  validation?: { maxLength?: number };

  // (Optional) conditional rendering if you later add dependencies
  conditional?: { dependsOn: string; showIf: string[] };
};

// We’ll store a single heterogeneous array in drafts/users/{uid}/drafts/{rid}.macro
type MacroAnswer =
  | { questionId: string; type: "likert"; score: number }
  | { questionId: string; type: "select"; value: string }
  | { questionId: string; type: "chips"; value: string[] }
  | { questionId: string; type: "textarea"; value: string }
  | { questionId: string; type: "country-multi"; value: string[] };

function isAnswered(q: MacroQuestion, ans?: MacroAnswer) {
  if (!ans) return false;
  switch (q.type ?? (Array.isArray(q.scale) ? "likert" : "select")) {
    case "likert":
      return typeof (ans as any).score === "number";
    case "select":
      return (
        typeof (ans as any).value === "string" && (ans as any).value.length > 0
      );
    case "chips":
      return Array.isArray((ans as any).value) && (ans as any).value.length > 0;
    case "textarea":
      return (
        typeof (ans as any).value === "string" &&
        (ans as any).value.trim().length > 0
      );
    case "country-multi":
      return Array.isArray((ans as any).value) && (ans as any).value.length > 0;
    default:
      return false;
  }
}

// --- Shared helpers to match QuizOptionGrid reveal & color logic ---
const COLOR_CLASSES = [
  "text-mint-600",
  "text-sky-600",
  "text-blush-600",
  "text-lav-600",
  "text-sand-600",
];

function colorClassForId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

function useReveal() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => setVisible(e.isIntersecting)),
      { threshold: 0.6 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, visible };
}

function SelectQuestion({
  q,
  value,
  onChange,
}: {
  q: MacroQuestion;
  value?: string;
  onChange: (v: string) => void;
}) {
  // Single-select buttons (chip style), matching QuizOptionGrid reveal/spacing/colors
  const { ref, visible } = useReveal();
  const color = colorClassForId(q.id);

  const cols = q.options?.some((o) => (o.label?.length ?? 0) > 24)
    ? "grid-cols-1"
    : q.options!.length >= 6
    ? "grid-cols-2 md:grid-cols-3"
    : "grid-cols-2 md:grid-cols-2";

  return (
    <div ref={ref} className="mb-24 min-h-[60vh] flex flex-col justify-center">
      <p
        className={`mb-6 text-2xl md:text-3xl font-semibold text-center reveal ${
          visible ? "is-visible" : ""
        } ${color}`}
      >
        {q.text}
      </p>

      <div
        className={`grid gap-4 ${cols} max-w-3xl mx-auto w-full reveal ${
          visible ? "is-visible" : ""
        }`}
      >
        {(q.options ?? []).map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex items-center justify-center p-3 md:p-4 quiz-option ${
                active ? "quiz-option-selected" : ""
              }`}
              aria-pressed={active}
            >
              <span className="text-sm md:text-base font-medium text-center leading-snug">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ChipsQuestion({
  q,
  value,
  onChange,
}: {
  q: MacroQuestion;
  value?: string[];
  onChange: (v: string[]) => void;
}) {
  const { ref, visible } = useReveal();
  const color = colorClassForId(q.id);
  const chosen = new Set(value ?? []);

  const toggle = (val: string) => {
    const next = new Set(chosen);
    if (next.has(val)) next.delete(val);
    else next.add(val);
    onChange(Array.from(next));
  };

  const cols =
    (q.options?.length ?? 0) >= 6
      ? "grid-cols-2 md:grid-cols-3"
      : "grid-cols-2 md:grid-cols-2";

  return (
    <div ref={ref} className="mb-24 min-h-[60vh] flex flex-col justify-center">
      <p
        className={`mb-6 text-2xl md:text-3xl font-semibold text-center reveal ${
          visible ? "is-visible" : ""
        } ${color}`}
      >
        {q.text}
      </p>

      <div
        className={`grid gap-4 ${cols} max-w-3xl mx-auto w-full reveal ${
          visible ? "is-visible" : ""
        }`}
      >
        {(q.options ?? []).map((opt) => {
          const active = chosen.has(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggle(opt.value)}
              className={`flex items-center justify-center p-3 md:p-4 quiz-option ${
                active ? "quiz-option-selected" : ""
              }`}
              aria-pressed={active}
            >
              <span className="text-sm md:text-base font-medium text-center leading-snug">
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TextareaQuestion({
  q,
  value,
  onChange,
}: {
  q: MacroQuestion;
  value?: string;
  onChange: (v: string) => void;
}) {
  const { ref, visible } = useReveal();
  const color = colorClassForId(q.id);
  const max = q.validation?.maxLength ?? 600;

  return (
    <div ref={ref} className="mb-24 min-h-[60vh] flex flex-col justify-center">
      <p
        className={`mb-6 text-2xl md:text-3xl font-semibold text-center reveal ${
          visible ? "is-visible" : ""
        } ${color}`}
      >
        {q.text}
      </p>

      <div
        className={`reveal ${
          visible ? "is-visible" : ""
        } max-w-2xl mx-auto w-full`}
      >
        <textarea
          className="form-field w-full rounded-xl text-sm md:text-base min-h-[160px]"
          placeholder={q.placeholder ?? "Type your response…"}
          value={value ?? ""}
          maxLength={max}
          onChange={(e) => onChange(e.target.value)}
        />
        <div className="mt-1 text-[11px] text-gray-500 text-right">
          {value?.length ?? 0}/{max}
        </div>
      </div>
    </div>
  );
}

function CountryMultiQuestion({
  q,
  value,
  onChange,
}: {
  q: MacroQuestion;
  value?: string[];
  onChange: (v: string[]) => void;
}) {
  const [draft, setDraft] = useState("");

  const addOne = () => {
    const v = draft.trim();
    if (!v) return;
    const next = Array.from(new Set([...(value ?? []), v]));
    onChange(next);
    setDraft("");
  };

  const removeOne = (val: string) => {
    onChange((value ?? []).filter((x) => x !== val));
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{q.text}</div>
      <div className="flex gap-2">
        <input
          className="form-field flex-1"
          placeholder="Type a country and press Add (e.g., Australia)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addOne();
            }
          }}
        />
        <button type="button" className="btn btn-outline" onClick={addOne}>
          Add
        </button>
      </div>
      {!!value?.length && (
        <div className="flex flex-wrap gap-2">
          {value!.map((c) => (
            <span key={c} className="badge">
              {c}
              <button
                type="button"
                className="ml-1 text-[11px] text-gray-500 hover:text-gray-800"
                onClick={() => removeOne(c)}
                aria-label={`Remove ${c}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MacroPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get("rid") || undefined;

  const { user, loading } = useAuth();

  const [answers, setAnswers] = useState<MacroAnswer[]>([]);
  const [prefillLoading, setPrefillLoading] = useState<boolean>(!!ridParam);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/app/quiz/macro");
  }, [loading, user, router]);

  // Load questions (typed)
  const questions = useMemo(() => {
    const raw = macroQuestions as unknown as MacroQuestion[];

    // Normalize type
    const normalized = raw.map((q) => ({
      ...q,
      type: q.type ?? (Array.isArray(q.scale) ? "likert" : "select"),
    })) as MacroQuestion[];

    // Base order: likert first, then select/chips/textarea/country-multi
    const baseOrder: Record<QType, number> = {
      likert: 1,
      select: 2,
      chips: 3,
      textarea: 4,
      "country-multi": 5,
    };

    const sorted = normalized.sort((a, b) => {
      const pa = baseOrder[a.type ?? "select"];
      const pb = baseOrder[b.type ?? "select"];
      return pa - pb;
    });

    // Force preferred_countries to sit right after where_to_work
    const iWhere = sorted.findIndex((q) => q.id === "where_to_work");
    const iPref = sorted.findIndex((q) => q.id === "preferred_countries");
    if (iWhere !== -1 && iPref !== -1 && iPref !== iWhere + 1) {
      const [pref] = sorted.splice(iPref, 1);
      sorted.splice(iWhere + 1, 0, pref);
    }

    return sorted;
  }, []);

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

        // Accept legacy [{questionId, score}] by lifting them into MacroAnswer
        const stored = Array.isArray(data?.data) ? (data.data as any[]) : [];
        const normalized: MacroAnswer[] = stored.map((a) => {
          const q = questions.find((qq) => qq.id === a.questionId);
          const t = q?.type ?? "likert";
          if (t === "likert")
            return {
              questionId: a.questionId,
              type: "likert",
              score: Number(a.score) || 0,
            };
          if (t === "select")
            return {
              questionId: a.questionId,
              type: "select",
              value: String(a.value ?? ""),
            };
          if (t === "chips")
            return {
              questionId: a.questionId,
              type: "chips",
              value: Array.isArray(a.value) ? a.value : [],
            };
          if (t === "country-multi") {
            return {
              questionId: a.questionId,
              type: "country-multi",
              value: Array.isArray(a.value) ? a.value : [],
            };
          }
          return {
            questionId: a.questionId,
            type: "textarea",
            value: String(a.value ?? ""),
          };
        });

        if (active) setAnswers(normalized);
      } catch (e: any) {
        if (active)
          setPrefillError(
            e?.message || "Failed to load your previous answers."
          );
      } finally {
        if (active) setPrefillLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [user, ridParam, questions]);

  if (loading || !user) return null;

  // Helpers to read/update a single answer
  const getAnswer = (qid: string) => answers.find((a) => a.questionId === qid);

  const upsertAnswer = (next: MacroAnswer) => {
    setAnswers((prev) => {
      const i = prev.findIndex((a) => a.questionId === next.questionId);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = next;
        return copy;
      }
      return [...prev, next];
    });
  };

  const meetsCondition = (q: MacroQuestion) => {
    if (!q.conditional) return true;
    const { dependsOn, showIf } = q.conditional;
    const depAns = answers.find((a) => a.questionId === dependsOn);
    if (!depAns) return false;

    if ("value" in depAns && typeof depAns.value === "string") {
      return (showIf ?? []).includes(depAns.value);
    }
    if ("value" in depAns && Array.isArray(depAns.value)) {
      return depAns.value.some((v) => (showIf ?? []).includes(v));
    }
    if ("score" in depAns) {
      return (showIf ?? []).includes(String(depAns.score));
    }
    return false;
  };
  
  // Only count questions that are actually visible (meet condition)
  const visibleQuestions = questions.filter(meetsCondition);

  const total = visibleQuestions.length;
  const answeredCount = visibleQuestions.filter((q) =>
    isAnswered(q, getAnswer(q.id))
  ).length;
  const allAnswered = answeredCount === total;

  const onSaveAndExit = async () => {
    const { id: rid } = await ensureDraft(user!, ridParam);
    await saveSection(user!, rid, "macro", answers, "macro_done");
    router.push(`/app`);
  };


  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <ProgressBar
          value={total ? answeredCount / total : 0}
          label="Career preferences"
        />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-4">
        Big picture
      </h2>

      {prefillLoading && (
        <div className="mb-4 text-sm text-gray-600">
          Loading your previous answers…
        </div>
      )}
      {prefillError && (
        <div className="mb-4 text-sm text-red-600">{prefillError}</div>
      )}

      <div className="space-y-6">
        {questions.map((q) => {
          // Hide if its condition is not met
          if (!meetsCondition(q)) return null;

          const t = q.type ?? "likert";

          if (t === "likert") {
            const sel = (
              getAnswer(q.id) as Extract<MacroAnswer, { type: "likert" }>
            )?.score;
            return (
              <QuizOptionGrid
                key={q.id}
                question={{
                  id: q.id,
                  text: q.text,
                  scale: q.scale ?? ["1", "2", "3", "4", "5"],
                }}
                selected={sel}
                onSelect={(id, score) =>
                  upsertAnswer({ questionId: id, type: "likert", score })
                }
              />
            );
          }

          if (t === "select") {
            const val = (
              getAnswer(q.id) as Extract<MacroAnswer, { type: "select" }>
            )?.value;
            return (
              <SelectQuestion
                key={q.id}
                q={q}
                value={val}
                onChange={(v) =>
                  upsertAnswer({ questionId: q.id, type: "select", value: v })
                }
              />
            );
          }

          if (t === "chips") {
            const val = (
              getAnswer(q.id) as Extract<MacroAnswer, { type: "chips" }>
            )?.value;
            return (
              <ChipsQuestion
                key={q.id}
                q={q}
                value={val}
                onChange={(v) =>
                  upsertAnswer({ questionId: q.id, type: "chips", value: v })
                }
              />
            );
          }

          if (t === "country-multi") {
            const val = (
              getAnswer(q.id) as Extract<MacroAnswer, { type: "country-multi" }>
            )?.value;
            return (
              <CountryMultiQuestion
                key={q.id}
                q={q}
                value={val}
                onChange={(v) =>
                  upsertAnswer({
                    questionId: q.id,
                    type: "country-multi",
                    value: v,
                  })
                }
              />
            );
          }

          // textarea
          const val = (
            getAnswer(q.id) as Extract<MacroAnswer, { type: "textarea" }>
          )?.value;
          return (
            <TextareaQuestion
              key={q.id}
              q={q}
              value={val}
              onChange={(v) =>
                upsertAnswer({ questionId: q.id, type: "textarea", value: v })
              }
            />
          );
        })}
      </div>

      <div className="flex justify-end mt-8">
        <button
          onClick={onSaveAndExit}
          disabled={!allAnswered}
          className="btn btn-primary disabled:opacity-50"
        >
          Save & Return
        </button>
      </div>
    </div>
  );
}
