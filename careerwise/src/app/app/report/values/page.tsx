// src/app/app/report/values/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import ReportNav from "@/app/components/ReportNav";

import { computeMotivators } from "@/app/lib/results/motivators/computeMotivators";
import { loadIntakeSummary } from "@/app/lib/results/loaders";
import { loadRiasecSummary } from "@/app/lib/results/loaders/map-riasec";
import { loadBig5Summary } from "@/app/lib/results/loaders/map-big5";
import type { Motivator } from "@/app/lib/results/types";

/* ---------- Small UI atoms ---------- */
function ConfidencePill({ level }: { level: Motivator["confidence"] }) {
  const map =
    level === "high"
      ? "bg-emerald-100 text-emerald-800 border-emerald-200"
      : level === "medium"
      ? "bg-amber-100 text-amber-800 border-amber-200"
      : "bg-gray-100 text-gray-700 border-gray-200";
  const label =
    level === "high" ? "High confidence" : level === "medium" ? "Likely" : "Tentative";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${map}`}>
      {label}
    </span>
  );
}

function ScoreBar({ score }: { score: number | undefined }) {
  const pct = Math.max(0, Math.min(100, Math.round(score ?? 0)));
  return (
    <div className="mt-3">
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg,var(--sky-400),var(--mint-400))",
          }}
        />
      </div>
      <div className="mt-1 text-[11px] text-gray-500">{pct}% match</div>
    </div>
  );
}

function CoachBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-[var(--mint-200)]" />
        <div className="rounded-2xl px-4 py-3 bg-[var(--mint-50)] border border-[var(--mint-200)] text-[1.05rem] leading-relaxed text-gray-800 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}

function TradeoffPill({ a, b, note }: { a: string; b: string; note: string }) {
  return (
    <div className="rounded-xl border border-gray-200 p-3 bg-white shadow-sm">
      <div className="text-sm font-medium text-gray-900">
        {a} ↔︎ {b}
      </div>
      <div className="text-sm text-gray-600 mt-1">{note}</div>
    </div>
  );
}

function ThriveCheck({ label }: { label: string }) {
  return (
    <label className="flex items-start gap-2 text-sm text-gray-700">
      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" defaultChecked />
      <span>{label}</span>
    </label>
  );
}

function ValueCard({
  m,
  coachNote,
  examples = [],
}: {
  m: Motivator;
  coachNote: string;
  examples: string[];
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{m.label}</h2>
        <ConfidencePill level={m.confidence} />
      </div>
      <p className="text-gray-700">{coachNote}</p>
      <ScoreBar score={m.score} />
      {examples.length > 0 && (
        <ul className="mt-2 list-disc list-inside text-sm text-gray-600">
          {examples.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ---------- Animations ---------- */
function FadeBlock({
  children,
  index,
  delayPerItem = 160,
}: {
  children: React.ReactNode;
  index: number;
  delayPerItem?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 140 + index * delayPerItem);
    return () => clearTimeout(t);
  }, [index, delayPerItem]);
  return (
    <div
      className={`transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {children}
    </div>
  );
}

/* ---------- Page ---------- */
export default function WorkValuesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [motivs, setMotivs] = useState<Motivator[]>([]);

  // Keep hooks order stable: derive any memos BEFORE conditional returns
  const top3 = useMemo(() => motivs.slice(0, 3), [motivs]);

  // conversational bits
  const coachIntro = useMemo(() => {
    if (!top3.length) return "I don’t have enough signals to speak confidently yet.";
    const names = top3.map((v) => v.label.toLowerCase());
    return `From your answers, you light up when work gives you ${names[0]}${
      names[1] ? ", " + names[1] : ""
    }${names[2] ? " and " + names[2] : ""}. Let’s translate that into day-to-day choices.`;
  }, [top3]);

  const examplesByKey: Record<string, string[]> = {
    autonomy: ["Own a clear problem end-to-end", "Negotiate flexible hours or WFH cadence"],
    mastery: ["Set a weekly ‘deep work’ block for skill drills", "Ship one small craft improvement"],
    impact: ["Shadow a customer call", "Volunteer for a task with visible outcomes"],
    creativity: ["Prototype an alternative approach", "Pitch one ‘we could try…’ idea"],
    recognition: ["Share a demo in team show-and-tell", "Document a win and its impact"],
    stability: ["Clarify SLAs and boundaries", "Plan work in two-week increments"],
    service: ["Offer a 30-min mentorship slot", "Pair on a teammate’s task"],
    adventure: ["Pick a slightly scary task this sprint", "Rotate into a new domain briefly"],
    structure: ["Co-create a ‘definition of done’", "Adopt a lightweight working agreement"],
    belonging: ["Celebrate small wins", "Schedule one relational 1:1 per week"],
  };

  const tradeoffs = useMemo(() => {
    const keys = motivs.map((m) => m.key);
    const has = (k: string) => keys.includes(k as any);
    const out: Array<{ a: string; b: string; note: string }> = [];
    if (has("autonomy") && has("stability"))
      out.push({
        a: "Autonomy",
        b: "Stability",
        note: "Aim for freedom within guardrails: define goals, not steps.",
      });
    if (has("creativity") && has("structure"))
      out.push({
        a: "Creativity",
        b: "Structure",
        note: "Use ‘sandbox → spec’: explore first, then lock a plan.",
      });
    if (has("recognition") && has("service"))
      out.push({
        a: "Recognition",
        b: "Service",
        note: "Alternate spotlight tasks with behind-the-scenes support.",
      });
    if (has("adventure") && has("stability"))
      out.push({
        a: "Variety",
        b: "Predictability",
        note: "Time-box experiments inside a stable rhythm.",
      });
    return out;
  }, [motivs]);

  const thriveChecks = useMemo(() => {
    const map: Record<string, string[]> = {
      autonomy: ["Clear ownership of outcomes", "Low micromanagement", "Flexible execution"],
      mastery: ["Time for deep work", "Feedback loops on craft", "Stretch projects"],
      impact: ["User contact or metrics", "Visible line to customer value"],
      creativity: ["Room for iteration", "Tolerance for v1/v2 drafts"],
      recognition: ["Demo culture", "Career ladder clarity", "Public wins are noticed"],
      stability: ["Realistic pacing", "Clear priorities", "Predictable processes"],
      service: ["Mentorship opportunities", "Collaborative rituals"],
      adventure: ["Cross-functional exposure", "Space for small spikes/experiments"],
      structure: ["Definitions of done", "Working agreements", "Good tooling"],
      belonging: ["Psychological safety", "Regular 1:1s", "Celebration of small wins"],
    };
    return motivs.slice(0, 3).flatMap((m) => map[m.key] ?? []);
  }, [motivs]);

  const watchouts = useMemo(() => {
    const notes: string[] = [];
    const byKey = (k: string) => motivs.find((m) => m.key === k);
    if (byKey("autonomy") && !byKey("structure"))
      notes.push("High autonomy can feel chaotic without weekly checkpoints.");
    if (byKey("recognition") && byKey("service"))
      notes.push(
        "Aiming for visibility and support together? Protect time for both so neither feels neglected."
      );
    if (byKey("stability") && byKey("adventure"))
      notes.push("Batch novelty to avoid constant context switching.");
    return notes;
  }, [motivs]);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setErr(null);

        // Load summaries in parallel
        const [intake, riasec, big5] = await Promise.all([
          loadIntakeSummary(user, rid).catch(() => undefined),
          loadRiasecSummary(user, rid).catch(() => undefined),
          loadBig5Summary(user, rid).catch(() => undefined),
        ]);

        // Safe intake text (no schema assumptions)
        const intakeText = intake
          ? Object.values(intake)
              .map((v) => (typeof v === "string" ? v : JSON.stringify(v)))
              .join(" ")
              .slice(0, 2000)
          : "";

        // RIASEC 1–5 map
        const riasecMap = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
        (riasec?.scores ?? []).forEach((s) => {
          const k = s.key as keyof typeof riasecMap;
          if (k in riasecMap) riasecMap[k] = s.avg ?? 0;
        });

        // Big-5 1–5 map
        const big5Map = {
          O: big5?.avg?.O ?? 0,
          C: big5?.avg?.C ?? 0,
          E: big5?.avg?.E ?? 0,
          A: big5?.avg?.A ?? 0,
          N: big5?.avg?.N ?? 0,
        };

        // Deterministic motivator synthesis
        const computed = await computeMotivators({
          big5: big5Map,
          riasec: riasecMap,
          intakeText,
        });

        setMotivs(computed);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load work values");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  /* ---------- States ---------- */
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-600">
        Calculating your work values…
      </div>
    );
  }
  if (err) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-red-600">{err}</div>;
  }

  /* ---------- Render (coach-style narrative) ---------- */
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      {/* NAV */}
      <ReportNav rid={rid} />

      {/* 1) HEADER + Coach intro */}
      <FadeBlock index={0}>
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight">What Drives You at Work</h1>
          <CoachBubble>{coachIntro}</CoachBubble>
        </header>
      </FadeBlock>

      {/* 2) Top values → meaning (cards) */}
      {top3.length > 0 && (
        <FadeBlock index={1}>
          <section className="grid gap-4">
            {top3.map((m) => (
              <ValueCard
                key={m.key}
                m={m}
                coachNote={m.rationale}
                examples={examplesByKey[m.key] ?? []}
              />
            ))}
          </section>
        </FadeBlock>
      )}

      {/* 3) Trade-offs & frictions */}
      {tradeoffs.length > 0 && (
        <FadeBlock index={2}>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Trade-offs to Navigate</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {tradeoffs.map((t, i) => (
                <TradeoffPill key={i} {...t} />
              ))}
            </div>
          </section>
        </FadeBlock>
      )}

      {/* 4) When you thrive (checklist) */}
      {thriveChecks.length > 0 && (
        <FadeBlock index={3}>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Conditions to Look For</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              {thriveChecks.map((c, i) => (
                <ThriveCheck key={i} label={c} />
              ))}
            </div>
          </section>
        </FadeBlock>
      )}

      {/* 5) Watch-outs */}
      {watchouts.length > 0 && (
        <FadeBlock index={4}>
          <section className="space-y-3">
            <h2 className="text-2xl font-semibold">Watch-outs</h2>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              {watchouts.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        </FadeBlock>
      )}

      {/* 6) Conversation prompt */}
      <FadeBlock index={5}>
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Say It Out Loud</h2>
          <p className="text-sm text-gray-700">
            “I do my best work when I have <strong>{top3[0]?.label}</strong>
            {top3[1] && (
              <>
                {" "}
                and <strong>{top3[1].label}</strong>
              </>
            )}
            . Could we shape my next project to include those conditions?”
          </p>
        </section>
      </FadeBlock>

      {/* Pager */}
      <div className="flex justify-between pt-2">
        <button onClick={() => router.push(`/app/report/big5?rid=${rid}`)} className="btn btn-ghost">
          ← Back: Big-5
        </button>
        <button onClick={() => router.push(`/app/report/team-role?rid=${rid}`)} className="btn btn-primary">
          Next: Team Role & Collaboration →
        </button>
      </div>
    </div>
  );
}