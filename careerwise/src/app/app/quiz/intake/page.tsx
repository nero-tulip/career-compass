// src/app/app/quiz/intake/page.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import intakeConfig from "@/app/data/intakeQuestions.json";
import { useAuth } from "@/app/providers/AuthProvider";
import { ensureDraft, saveSection } from "@/app/lib/drafts";
import ProgressBar from "@/app/components/ProgressBar";

// Types derived from intakeQuestions.json
type IntakeOption = { value: string; label: string };
type IntakeUI = { variant?: string; maxSelect?: number } | undefined;
type Conditional = { dependsOn: string; showIf: string[] } | undefined;

type BaseQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "chips" | "slider" | "country" | "country-multi";
  required?: boolean;
  placeholder?: string;
  mapTo?: string;
  weight?: number;
  options?: IntakeOption[];
  ui?: IntakeUI;
  conditional?: Conditional;
};

type SliderQuestion = BaseQuestion & {
  type: "slider";
  min?: number;
  max?: number;
  default?: number;
  leftLabel?: string;
  rightLabel?: string;
};

type Question = BaseQuestion | SliderQuestion;
type Q = (typeof intakeConfig)["questions"][number] & Question;

type Country = { code: string; name: string };
type AnswerValue = string | number | string[] | Country[];

// Deterministic color per question id (match quiz appearance)
const COLOR_CLASSES = [
  "text-mint-600",
  "text-sky-600",
  "text-blush-600",
  "text-lav-600",
  "text-sand-600",
] as const;
function colorClassForId(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

export default function IntakePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get("rid") || undefined;

  const { user, loading } = useAuth();
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [prefillLoading, setPrefillLoading] = useState<boolean>(!!ridParam);
  const [prefillError, setPrefillError] = useState<string | null>(null);

  const questions: Q[] = useMemo(() => intakeConfig.questions as Q[], []);

  // redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/app/quiz/intake");
  }, [loading, user, router]);
  if (loading || !user) return null;

  // NEW: prefill from saved answers if a rid is present
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        if (!ridParam) {
          if (active) setPrefillLoading(false);
          return;
        }
        const token = await user.getIdToken?.();
        const res = await fetch(
          `/api/quiz/section?rid=${encodeURIComponent(ridParam)}&section=intake`,
          { headers: { Authorization: "Bearer " + token } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // Expecting an object map of { [questionId]: value }
        const stored = data?.data;
        if (active && stored && typeof stored === "object") {
          setAnswers(stored as Record<string, AnswerValue>);
        }
      } catch (e: any) {
        if (active) setPrefillError(e?.message || "Failed to load previous answers.");
      } finally {
        if (active) setPrefillLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [ridParam, user]);

  const setVal = (id: string, v: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [id]: v }));

  const visibleQuestions = questions.filter((q) => {
    if (!q.conditional) return true;
    const dep = answers[q.conditional.dependsOn];
    return typeof dep === "string" && q.conditional.showIf.includes(dep);
  });

  const requiredMissing = visibleQuestions
    .filter((q) => q.required)
    .some((q) => {
      const v = answers[q.id];
      if (v == null) return true;
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === "string") return v.trim().length === 0;
      return false;
    });

  const answeredCount = visibleQuestions.filter((q) => {
    const v = answers[q.id];
    if (v == null) return false;
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === "string") return v.trim().length > 0;
    return true;
  }).length;

  const onNext = async () => {
    if (requiredMissing) {
      alert("Please fill the required fields.");
      return;
    }
    const { id: rid } = await ensureDraft(user, ridParam);
    await saveSection(user, rid, "intake", answers, "intake_done");
    router.push(`/app`);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="mb-6">
        <ProgressBar
          value={visibleQuestions.length ? answeredCount / visibleQuestions.length : 0}
          label="Intro questions"
        />
      </div>

      <h2 className="text-2xl font-semibold tracking-tight mb-4">
        {intakeConfig.meta?.title ?? "Tell us about you"}
      </h2>
      <p className="muted mb-8">
        {intakeConfig.meta?.description ?? "A few quick questions to personalize your results."}
      </p>

      {/* Optional lightweight status */}
      {prefillLoading && (
        <div className="mb-4 text-sm text-gray-600">Loading your previous answers…</div>
      )}
      {prefillError && (
        <div className="mb-4 text-sm text-red-600">{prefillError}</div>
      )}

      {visibleQuestions.map((q) => (
        <QuestionBlock
          key={q.id}
          q={q}
          value={answers[q.id]}
          onChange={(v) => setVal(q.id, v)}
        />
      ))}

      <div className="flex justify-end mt-8">
        <button
          onClick={onNext}
          className="btn btn-primary disabled:opacity-50"
          disabled={requiredMissing}
        >
          Next
        </button>
      </div>
    </div>
  );
}

function QuestionBlock({
  q,
  value,
  onChange,
}: {
  q: Q;
  value: AnswerValue | undefined;
  onChange: (v: AnswerValue) => void;
}) {
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

  const labelEl = (
    <p
      className={`mb-4 text-xl md:text-2xl font-semibold ${colorClassForId(
        q.id
      )} text-center reveal ${visible ? "is-visible" : ""}`}
    >
      {q.label}
      {q.required ? " *" : ""}
    </p>
  );

  if (q.type === "text") {
    return (
      <div ref={ref} className="mb-28">
        {labelEl}
        <div className={`max-w-xl mx-auto reveal ${visible ? "is-visible" : ""}`}>
          <input
            className="w-full form-field"
            placeholder={q.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    );
  }
  if (q.type === "textarea") {
    return (
      <div ref={ref} className="mb-28">
        {labelEl}
        <div className={`max-w-xl mx-auto reveal ${visible ? "is-visible" : ""}`}>
          <textarea
            className="w-full form-field"
            rows={4}
            placeholder={q.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
    );
  }
  if (q.type === "select") {
    const v = typeof value === "string" ? value : "";
    return (
      <div ref={ref} className="mb-32">
        {labelEl}
        <div
          className={`grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto reveal ${
            visible ? "is-visible" : ""
          }`}
        >
          {(q.options ?? []).map((opt) => {
            const active = v === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`quiz-option w-full p-3 md:p-4 ${
                  active ? "quiz-option-selected" : ""
                }`}
                aria-pressed={active}
              >
                <span className="font-medium text-base md:text-lg leading-snug text-center">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (q.type === "chips") {
    const current: string[] = Array.isArray(value) ? (value as string[]) : [];
    const max = q.ui?.maxSelect;
    return (
      <div ref={ref} className="mb-32">
        {labelEl}
        <div
          className={`grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-w-3xl mx-auto reveal ${
            visible ? "is-visible" : ""
          }`}
        >
          {(q.options ?? []).map((opt) => {
            const active = current.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  let next = active
                    ? current.filter((v) => v !== opt.value)
                    : [...current, opt.value];
                  if (typeof max === "number" && next.length > max)
                    next = next.slice(0, max);
                  onChange(next);
                }}
                className={`quiz-option w-full p-3 md:p-4 ${
                  active ? "quiz-option-selected" : ""
                }`}
                aria-pressed={active}
              >
                <span className="font-medium text-base md:text-lg leading-snug text-center">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (q.type === "slider") {
    const s = q as SliderQuestion;
    const v = typeof value === "number" ? value : s.default ?? 50;
    const min = s.min ?? 0;
    const max = s.max ?? 100;
    return (
      <div ref={ref} className="mb-32">
        {labelEl}
        <div className={`max-w-3xl mx-auto reveal ${visible ? "is-visible" : ""}`}>
          <div className="flex items-center gap-4">
            <span className="muted text-sm">{s.leftLabel}</span>
            <input
              type="range"
              min={min}
              max={max}
              value={v}
              onChange={(e) => onChange(Number(e.target.value))}
              step={1}
              className="w-full"
            />
            <span className="text-sm font-medium tabular-nums rounded-md border border-[--border] bg-[--surface] px-2 py-1 min-w-10 text-center">
              {v}
            </span>
            <span className="muted text-sm">{s.rightLabel}</span>
          </div>
        </div>
      </div>
    );
  }
  if (q.type === "country") {
    return (
      <div ref={ref} className="mb-28">
        {labelEl}
        <div className={`max-w-xl mx-auto reveal ${visible ? "is-visible" : ""}`}>
          <input
            className="w-full form-field"
            placeholder={q.placeholder ?? "e.g., Australia"}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(e.target.value.trim())}
          />
        </div>
      </div>
    );
  }
  if (q.type === "country-multi") {
    return (
      <div ref={ref} className="mb-28">
        {labelEl}
        <div className={`max-w-xl mx-auto reveal ${visible ? "is-visible" : ""}`}>
          <input
            className="w-full form-field"
            placeholder={q.placeholder ?? "e.g., United States, Japan"}
            onChange={(e) => {
              const items = e.target.value
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s.length > 0)
                .map<Country>((s) => ({ code: s.toUpperCase().slice(0, 2), name: s }));
              onChange(items);
            }}
          />
        </div>
      </div>
    );
  }
  return null;
}