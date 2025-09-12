"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import intakeConfig from "@/app/data/intakeQuestions.json";
import { useAuth } from "@/app/providers/AuthProvider";
import { ensureDraft, saveSection } from "@/app/lib/drafts";

type Q = (typeof intakeConfig)["questions"][number];

export default function IntakePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const ridParam = sp.get("rid") || undefined;

  const { user, loading } = useAuth();
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const questions: Q[] = useMemo(() => intakeConfig.questions as any, []);

  if (loading) return null;
  if (!user) {
    router.replace("/start");
    return null;
  }

  const setVal = (id: string, v: any) => setAnswers(prev => ({ ...prev, [id]: v }));

  const requiredMissing = questions
    .filter(q => q.required)
    .some(q => {
      const v = answers[q.id];
      if (v == null) return true;
      if (Array.isArray(v)) return v.length === 0;
      if (typeof v === "string") return v.trim().length === 0;
      return false;
    });

  const onNext = async () => {
    if (requiredMissing) {
      alert("Please fill the required fields.");
      return;
    }
    const { id: rid } = await ensureDraft(user!, ridParam);
    await saveSection(user!, rid, "intake", answers, "intake_done");
    router.push(`/macro?rid=${rid}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
      <header className="card">
        <h1 className="text-xl font-semibold">Tell us about you</h1>
        <p className="muted">A few quick questions to personalize your results.</p>
      </header>

      {questions.map(q => (
        <Field key={q.id} q={q as any} value={answers[q.id]} onChange={(v) => setVal(q.id, v)} />
      ))}

      <div className="flex justify-end">
        <button onClick={onNext} className="btn-primary">Next</button>
      </div>
    </div>
  );
}

function Field({ q, value, onChange }: { q: any; value: any; onChange: (v:any)=>void }) {
  const label = <label className="block text-sm font-medium mb-1">{q.label}{q.required ? " *" : ""}</label>;

  if (q.type === "text") {
    return (
      <div className="card">
        {label}
        <input className="w-full rounded-[calc(var(--radius)-6px)] border border-[--border] px-3 py-2"
               placeholder={q.placeholder} value={value || ""} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  if (q.type === "textarea") {
    return (
      <div className="card">
        {label}
        <textarea className="w-full rounded-[calc(var(--radius)-6px)] border border-[--border] px-3 py-2" rows={4}
                  placeholder={q.placeholder} value={value || ""} onChange={e => onChange(e.target.value)} />
      </div>
    );
  }
  if (q.type === "select") {
    return (
      <div className="card">
        {label}
        <div className="grid gap-2">
          {q.options?.map((opt: any) => (
            <label key={opt.value} className="flex items-center justify-between gap-3 rounded-[calc(var(--radius)-6px)] border border-[--border] px-3 py-2 cursor-pointer hover:bg-[--primary-ghost]">
              <span>{opt.label}</span>
              <input type="radio" name={q.id} checked={value === opt.value} onChange={() => onChange(opt.value)} className="accent-[--primary]" />
            </label>
          ))}
        </div>
      </div>
    );
  }
  if (q.type === "chips") {
    const current: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="card">
        {label}
        <div className="flex flex-wrap gap-2">
          {q.options?.map((opt: any) => {
            const active = current.includes(opt.value);
            return (
              <button type="button" key={opt.value}
                      onClick={() => {
                        let next = active ? current.filter(v => v !== opt.value) : [...current, opt.value];
                        const max = q.ui?.maxSelect as number | undefined;
                        if (max && next.length > max) next = next.slice(0, max);
                        onChange(next);
                      }}
                      className={`px-3 py-1 rounded-full border ${active ? "bg-[--primary] border-[--primary]" : "border-[--border] bg-[--surface]"}`}>
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  if (q.type === "slider") {
    const v = typeof value === "number" ? value : q.default ?? 50;
    return (
      <div className="card">
        {label}
        <div className="flex items-center gap-3">
          <span className="muted text-sm">{q.leftLabel}</span>
          <input type="range" min={q.min ?? 0} max={q.max ?? 100} value={v} onChange={e => onChange(Number(e.target.value))} className="w-full" />
          <span className="muted text-sm">{q.rightLabel}</span>
        </div>
      </div>
    );
  }
  if (q.type === "country") {
    return (
      <div className="card">
        {label}
        <input className="w-full rounded-[calc(var(--radius)-6px)] border border-[--border] px-3 py-2"
               placeholder={q.placeholder ?? "e.g., Australia"} value={value || ""} onChange={e => onChange(e.target.value.trim())} />
      </div>
    );
  }
  if (q.type === "country-multi") {
    return (
      <div className="card">
        {label}
        <input className="w-full rounded-[calc(var(--radius)-6px)] border border-[--border] px-3 py-2"
               placeholder={q.placeholder ?? "e.g., United States, Japan"}
               onChange={e => onChange(e.target.value.split(",").map((s)=>({code:s.trim().toUpperCase().slice(0,2), name:s.trim()})).filter((c:any)=>c.name))} />
      </div>
    );
  }
  return null;
}
