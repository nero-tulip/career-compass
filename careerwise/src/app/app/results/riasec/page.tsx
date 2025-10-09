// src/app/app/results/riasec/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

type RIASEC = { R: number; I: number; A: number; S: number; E: number; C: number };
type RiaResult = { profile: RIASEC; top3?: string[]; computedAt: string };

// Labels (canonical RIASEC order)
const LABELS: Record<keyof RIASEC, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

// Per-trait UI colors (tweak to match your globals.css palette)
const TRAIT_UI: Record<keyof RIASEC, {
  text: string;   // headers / labels
  bar: string;    // filled bars
  ring: string;   // light borders/backgrounds
}> = {
  R: { text: "text-amber-700",   bar: "bg-amber-500",   ring: "border-amber-200" },
  I: { text: "text-sky-700",     bar: "bg-sky-500",     ring: "border-sky-200" },
  A: { text: "text-violet-700",  bar: "bg-violet-500",  ring: "border-violet-200" },
  S: { text: "text-emerald-700", bar: "bg-emerald-500", ring: "border-emerald-200" },
  E: { text: "text-rose-700",    bar: "bg-rose-500",    ring: "border-rose-200" },
  C: { text: "text-indigo-700",  bar: "bg-indigo-500",  ring: "border-indigo-200" },
};

// Friendly trait definitions (what each letter means)
const TRAIT_DEFS: Record<keyof RIASEC, string> = {
  R: "Hands-on, practical, and tactile. Realistic interests lean toward building, fixing, operating, and working with tools, machines, or the physical world. Labs, workshops, outdoors, and tangible results tend to feel satisfying.",
  I: "Curious, analytical, and systems-minded. Investigative interests lean toward research, puzzles, models, and understanding how things work. You enjoy digging into problems, data, and explanations.",
  A: "Creative, expressive, and original. Artistic interests lean toward design, writing, visual arts, music, and non-linear problem-solving. You value novelty, aesthetics, and personal voice.",
  S: "Supportive, people-first, and collaborative. Social interests lean toward teaching, coaching, counseling, care, and community work. You like helping others grow and feel understood.",
  E: "Persuasive, dynamic, and opportunity-seeking. Enterprising interests lean toward leadership, sales, entrepreneurship, and moving ideas into action. You enjoy influencing direction and results.",
  C: "Organized, detail-minded, and structured. Conventional interests lean toward planning, documentation, quality, and operational excellence. You like clarity, reliable processes, and making systems run smoothly.",
};

// Gentle per-trait interpretations (based on user’s score)
const TRAIT_PARAS: Record<keyof RIASEC, (v: number) => string> = {
  R: (v) =>
    v >= 3.5
      ? "You likely enjoy hands-on tasks and seeing tangible progress. Clear instructions, tools, and environments with visible outcomes tend to suit you."
      : "You may prefer less physical, more conceptual work. When you do hands-on tasks, light structure and a clear purpose can make them more engaging.",
  I: (v) =>
    v >= 3.5
      ? "You’re energized by analysis and understanding. Deep-work blocks, data, and complex problems can feel rewarding when you have time to explore."
      : "You might prefer applied tasks over long investigation. Quick experiments and bite-sized learning can help you stay curious without getting stuck.",
  A: (v) =>
    v >= 3.5
      ? "You value originality and expression. Flexible briefs, creative constraints, and space to iterate will bring out your best ideas."
      : "You may prefer clear templates and examples. When creativity is needed, starting from a strong reference can help ideas flow.",
  S: (v) =>
    v >= 3.5
      ? "You lead with empathy and collaboration. Roles with feedback, teamwork, and visible impact on people will feel meaningful."
      : "You may prefer independent work or small, focused teams. When collaboration is needed, clear roles and agendas keep it efficient.",
  E: (v) =>
    v >= 3.5
      ? "You like momentum and making things happen. Ownership, stakes, and visible progress tend to keep you motivated."
      : "You might prefer influence through expertise rather than persuasion. Asserting ideas in writing or prototypes can work better than live pitching.",
  C: (v) =>
    v >= 3.5
      ? "You appreciate clarity, systems, and follow-through. Checklists, calendars, and documented processes help you ship reliably."
      : "You may prefer flexibility over rigid plans. Light structure (today’s 1–3 priorities) can keep you moving without feeling boxed in.",
};

// --- Small UI atoms ---
function pctFrom1to5(v: number) {
  return Math.max(0, Math.min(100, Math.round((v / 5) * 100)));
}

function GraphCard({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      {title ? <div className="text-sm font-medium mb-2">{title}</div> : null}
      {children}
    </div>
  );
}

function Bar({
  value,
  color = "bg-gray-800",
  highlight,
}: {
  value: number;
  color?: string;
  highlight?: boolean;
}) {
  const pct = pctFrom1to5(value);
  return (
    <div className="space-y-1">
      <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${highlight ? "bg-gradient-to-r from-cyan-400 to-violet-500" : color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-800" />
          Your score {value.toFixed(2)}
        </span>
        <span className="text-gray-400">Scale 1–5</span>
      </div>
    </div>
  );
}

// Overall mini bars
function MiniStackBars({ profile }: { profile: RIASEC }) {
  const order: (keyof RIASEC)[] = ["R", "I", "A", "S", "E", "C"];
  return (
    <div className="grid gap-3">
      {order.map((k) => {
        const v = profile[k] ?? 0;
        return (
          <div key={k} className="flex items-center gap-3">
            <div className="w-32 text-xs text-gray-600">{LABELS[k]} ({k})</div>
            <div className="flex-1">
              <Bar value={v} color={TRAIT_UI[k].bar} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Simple radar for 6 traits
function RadarChart({ profile }: { profile: RIASEC }) {
  const order: (keyof RIASEC)[] = ["R", "I", "A", "S", "E", "C"];
  const cx = 120, cy = 120, rMax = 90;
  const angleFor = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI / order.length);
  const point = (i: number, val: number) => {
    const ratio = Math.max(0, Math.min(1, val / 5));
    const r = ratio * rMax;
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const pts = order.map((k, i) => point(i, profile[k] ?? 0));
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ") + " Z";

  const rings = [1, 2, 3, 4, 5].map((n) => ({ r: (n / 5) * rMax }));

  return (
    <svg viewBox="0 0 240 240" className="w-full h-auto">
      {rings.map((g, idx) => (
        <circle key={idx} cx={120} cy={120} r={g.r} fill="none" stroke="#E5E7EB" strokeWidth={1} />
      ))}
      {order.map((_, i) => {
        const [x, y] = [120 + rMax * Math.cos(angleFor(i)), 120 + rMax * Math.sin(angleFor(i))];
        return <line key={i} x1={120} y1={120} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={1} />;
      })}
      <path d={pathD} fill="rgba(99,102,241,0.20)" stroke="rgba(99,102,241,0.8)" strokeWidth={2} />
      {order.map((k, i) => {
        const [x, y] = [120 + (rMax + 14) * Math.cos(angleFor(i)), 120 + (rMax + 14) * Math.sin(angleFor(i))];
        return (
          <text key={k} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-gray-700 text-[10px]">
            {k}
          </text>
        );
      })}
    </svg>
  );
}

export default function RiasecResultPage() {
  const sp = useSearchParams();
  const rid = sp.get("rid") || "";
  const { user, loading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<RiaResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Safe profile so hooks below always run
  const safeProfile: RIASEC =
    result?.profile ?? { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // Top-3 letters (unconditional hook)
  const top3 = useMemo(() => {
    const entries = Object.entries(safeProfile) as Array<[keyof RIASEC, number]>;
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  }, [safeProfile]);

  // Fetch once
  useEffect(() => {
    let alive = true;
    (async () => {
      if (loading) return;
      if (!user) {
        router.replace("/login?next=/app/results/riasec");
        return;
      }
      try {
        setBusy(true);
        setErr(null);
        if (!rid) throw new Error("Missing result id (rid).");
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/results/section?rid=${encodeURIComponent(rid)}&section=riasec`,
          { headers: { Authorization: "Bearer " + token } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!alive) return;
        setResult(data.result as RiaResult);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load RIASEC results.");
      } finally {
        if (!alive) return;
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, loading, rid, router]);

  // Render states
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-red-600 font-medium mb-2">We couldn’t load your RIASEC result</div>
          <div className="text-sm text-gray-600 mb-4">{err}</div>
          <a href="/app" className="btn btn-primary">Back to dashboard</a>
        </div>
      </div>
    );
  }

  if (!result) return null;

  const p = safeProfile;
  const ordered: (keyof RIASEC)[] = ["R", "I", "A", "S", "E", "C"];

  const intro =
    "RIASEC (Holland’s model) describes the kinds of work activities that tend to feel energizing: Realistic, Investigative, Artistic, Social, Enterprising, and Conventional. It’s a simple map of interests — not a box — that helps you notice the environments where your motivation naturally rises.";

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your RIASEC profile</h1>
        <p className="text-sm text-gray-600">
          Computed on {new Date(result.computedAt).toLocaleString()}
        </p>
      </header>

      {/* Intro (no border) */}
      <section className="space-y-2">
        <p className="text-gray-800 leading-relaxed">{intro}</p>
        <p className="text-xs text-gray-500">Scores use a 1–5 scale. Higher means stronger interest in that activity style.</p>
      </section>

      {/* Top three chips */}
      <section className="space-y-2">
        <div className="text-sm font-medium">Top three signals</div>
        <div className="flex gap-2 flex-wrap">
          {top3.map((k) => (
            <span key={k} className="px-2 py-1 rounded-full bg-black text-white text-xs">
              {LABELS[k]} ({k})
            </span>
          ))}
        </div>
      </section>

      {/* Per-trait sections: title → definition → graph (bordered) → interpretation */}
      {ordered.map((k) => {
        const val = p[k] ?? 0;
        const ui = TRAIT_UI[k];
        return (
          <section key={k} className="space-y-3">
            <h2 className={`text-xl font-semibold ${ui.text}`}>{LABELS[k]}</h2>

            {/* trait definition (no border — “report” feel) */}
            <p className="text-gray-800">{TRAIT_DEFS[k]}</p>

            {/* graph card */}
            <GraphCard title="Your result">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-700">{LABELS[k]} ({k})</span>
                <span className="tabular-nums text-gray-600">{val.toFixed(2)}</span>
              </div>
              <Bar value={val} color={ui.bar} highlight={top3.includes(k)} />
            </GraphCard>

            {/* interpretation */}
            <div className="text-sm text-gray-800">
              {TRAIT_PARAS[k](val)}
            </div>
          </section>
        );
      })}

      {/* Overall summary visuals */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Overall picture</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <GraphCard title="All interests at a glance">
            <MiniStackBars profile={p} />
          </GraphCard>
          <GraphCard title="Interest radar">
            <RadarChart profile={p} />
            <p className="text-xs text-gray-500 mt-2">Each point shows your score (1–5). Closer to the edge = stronger interest.</p>
          </GraphCard>
        </div>
      </section>

      {/* Wrap-up (no border) */}
      <section>
        <p className="text-gray-800 leading-relaxed">
          Interests don’t determine your future, but they do shape motivation. Lean into the styles that energize you,
          and add small habits to balance the rest. You can revisit your RIASEC any time.
        </p>
      </section>

      {/* Footer */}
      <div className="flex justify-between">
        <a href="/app" className="btn btn-ghost">Back to dashboard</a>
      </div>
    </div>
  );
}