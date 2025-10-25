// src/app/app/report/big5/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadBig5Summary } from "@/app/lib/results/loaders/map-big5";
import type { Big5Summary, Big5Key } from "@/app/lib/results/loaders/map-big5";
import { loadIntakeSummary } from "@/app/lib/results/loaders";
import type { IntakeSummary } from "@/app/lib/results/types";
import {
  generateBig5Section,
  type Big5Section,
} from "@/app/lib/results/generators/generate-big5-section";
import ReportNav from "@/app/components/ReportNav";

/* -------------------- Labels & Pop stats -------------------- */
const LABELS: Record<Big5Key, string> = {
  O: "Openness (O)",
  C: "Conscientiousness (C)",
  E: "Extraversion (E)",
  A: "Agreeableness (A)",
  N: "Neuroticism (N)",
};

// IPIP/BFI-aligned population references (approximate; 1–5 scale)
const POP_STATS: Record<Big5Key, { mean: number; sd: number }> = {
  O: { mean: 3.6, sd: 0.65 },
  C: { mean: 3.5, sd: 0.7 },
  E: { mean: 3.2, sd: 0.75 },
  A: { mean: 3.6, sd: 0.6 },
  N: { mean: 3.0, sd: 0.8 },
};

// Per-trait UI colors (feel free to map these to your pastels later)
const TRAIT_UI: Record<
  Big5Key,
  { text: string; bar: string; ring: string; axis: string }
> = {
  O: {
    text: "text-sky-700",
    bar: "bg-sky-500",
    ring: "border-sky-200",
    axis: "text-sky-600",
  },
  C: {
    text: "text-emerald-700",
    bar: "bg-emerald-500",
    ring: "border-emerald-200",
    axis: "text-emerald-600",
  },
  E: {
    text: "text-amber-700",
    bar: "bg-amber-500",
    ring: "border-amber-200",
    axis: "text-amber-600",
  },
  A: {
    text: "text-violet-700",
    bar: "bg-violet-500",
    ring: "border-violet-200",
    axis: "text-violet-600",
  },
  N: {
    text: "text-rose-700",
    bar: "bg-rose-500",
    ring: "border-rose-200",
    axis: "text-rose-600",
  },
};

/* -------------------- Small utilities -------------------- */
function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), 30);
    return () => clearTimeout(t);
  }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

function FadeBlock({
  children,
  index,
  delayPerItem = 200,
}: {
  children: React.ReactNode;
  index: number;
  delayPerItem?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250 + index * delayPerItem);
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

function pctFrom1to5(v: number) {
  return Math.max(0, Math.min(100, Math.round((v / 5) * 100)));
}
function toZ(score: number, mean: number, sd: number) {
  if (!sd) return 0;
  return (score - mean) / sd;
}
// fast normal CDF → percentile (0–100)
function zToPercentile(z: number) {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  let p =
    1 -
    d *
      (1.330274429 * t -
        1.821255978 * Math.pow(t, 2) +
        1.781477937 * Math.pow(t, 3) -
        0.356563782 * Math.pow(t, 4) +
        0.31938153 * Math.pow(t, 5));
  if (z < 0) p = 1 - p;
  return Math.round(p * 100);
}

/* -------------------- UI atoms -------------------- */
function GraphCard({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border bg-white p-4 shadow-sm border-gray-200 ${
        className || ""
      }`}
    >
      {title ? <div className="text-sm font-medium mb-2">{title}</div> : null}
      {children}
    </div>
  );
}

function TrendChip({ z }: { z: number }) {
  const abs = Math.abs(z);
  const sign = z >= 0 ? "+" : "−";
  const sigma = `${sign}${abs.toFixed(2)}σ`;
  const tone =
    abs >= 1.5
      ? "text-violet-700 bg-violet-50"
      : abs >= 0.5
      ? "text-sky-700 bg-sky-50"
      : "text-gray-700 bg-gray-100";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tone} border border-black/5`}
    >
      {sigma}
    </span>
  );
}

function PercentileChip({ p }: { p: number }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-black text-white">
      {p}th percentile
    </span>
  );
}

function Bar({
  value,
  popMean,
  color = "bg-gray-800",
  highlight,
}: {
  value: number;
  popMean: number;
  color?: string;
  highlight?: boolean;
}) {
  const pct = pctFrom1to5(value);
  const meanPct = pctFrom1to5(popMean);
  return (
    <div className="space-y-1">
      <div className="relative h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            highlight ? "bg-gradient-to-r from-cyan-400 to-violet-500" : color
          }`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
          style={{ left: `${meanPct}%` }}
          title="Population average"
        />
      </div>
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
          Your score {value.toFixed(2)}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-0.5 bg-gray-400" />
          Avg {popMean.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

type Big5Shape = { O: number; C: number; E: number; A: number; N: number };

function MiniStackBars({ traits }: { traits: Big5Shape }) {
  const order: Big5Key[] = ["O", "C", "E", "A", "N"];
  return (
    <div className="grid gap-3">
      {order.map((k) => {
        const v = traits[k] ?? 0;
        const mean = POP_STATS[k].mean;
        return (
          <div key={k} className="flex items-center gap-3">
            <div className={`w-36 text-xs ${TRAIT_UI[k].text}`}>
              {LABELS[k]}
            </div>
            <div className="flex-1">
              <Bar value={v} popMean={mean} color={TRAIT_UI[k].bar} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RadarChart({ traits }: { traits: Big5Shape }) {
  const order: Big5Key[] = ["O", "C", "E", "A", "N"];
  const cx = 120,
    cy = 120,
    rMax = 90;
  const angleFor = (i: number) =>
    -Math.PI / 2 + (i * 2 * Math.PI) / order.length;
  const point = (i: number, val: number) => {
    const ratio = Math.max(0, Math.min(1, val / 5));
    const r = ratio * rMax;
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const pts = order.map((k, i) => point(i, traits[k] ?? 0));
  const pathD =
    pts
      .map(
        (p, i) => `${i === 0 ? "M" : "L"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`
      )
      .join(" ") + " Z";

  const rings = [1, 2, 3, 4, 5].map((n) => ({ r: (n / 5) * rMax, label: n }));

  return (
    <svg viewBox="0 0 240 240" className="w-full h-auto">
      {rings.map((g, idx) => (
        <circle
          key={idx}
          cx={cx}
          cy={cy}
          r={g.r}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={1}
        />
      ))}
      {order.map((_, i) => {
        const [x, y] = [
          cx + rMax * Math.cos(angleFor(i)),
          cy + rMax * Math.sin(angleFor(i)),
        ];
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="#E5E7EB"
            strokeWidth={1}
          />
        );
      })}
      <path
        d={pathD}
        fill="rgba(99,102,241,0.20)"
        stroke="rgba(99,102,241,0.8)"
        strokeWidth={2}
      />
      {order.map((k, i) => {
        const [x, y] = [
          cx + (rMax + 14) * Math.cos(angleFor(i)),
          cy + (rMax + 14) * Math.sin(angleFor(i)),
        ];
        return (
          <text
            key={k}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className={`text-[10px] ${TRAIT_UI[k].axis}`}
          >
            {k}
          </text>
        );
      })}
    </svg>
  );
}

/* -------------------- Trait copy (plain-English defs + quick interp) -------------------- */
const TRAIT_DEFS: Record<Big5Key, string> = {
  O: `Openness captures curiosity, imagination, and the hunger to experience new ideas and perspectives. Higher scores lean creative and exploratory; lower scores lean practical and grounded.`,
  C: `Conscientiousness is about self-discipline, organization, and reliability — the engine behind consistency and follow-through.`,
  E: `Extraversion reflects social energy and stimulation-seeking — how much you recharge through people, excitement, and momentum.`,
  A: `Agreeableness measures empathy, cooperation, and the instinct to create harmony with others.`,
  N: `Neuroticism reflects emotional sensitivity — how strongly you feel stress, mood shifts, or worry. Higher can mean more responsive; lower can mean steadier.`,
};

const TRAIT_INTERP: Record<Big5Key, (v: number) => string> = {
  O: (v) =>
    v >= 3.5
      ? "You likely enjoy ideas, variety, and creative problem-solving. Exploration energizes you."
      : "You probably value clarity and proven methods. Steady, practical contexts bring out your best.",
  C: (v) =>
    v >= 3.5
      ? "You tend to plan, follow through, and keep things organized — systems help you (and teams) hum."
      : "You prefer flexibility over rigid structure. Light routines beat heavy process for you.",
  E: (v) =>
    v >= 3.5
      ? "You gain energy from people and visible progress. Collaboration and pace suit you."
      : "You recharge solo and go deep. Focus time and calm spaces support your best work.",
  A: (v) =>
    v >= 3.5
      ? "You lead with warmth and trust. People feel safe collaborating with you."
      : "You’re direct and independent — great for clear decisions and honest feedback.",
  N: (v) =>
    v >= 3.5
      ? "You feel things strongly and notice stress signals early — that sensitivity can be a strength with good boundaries."
      : "You tend to stay steady under pressure — a grounding presence for projects and people.",
};

/* -------------------- Page -------------------- */
export default function Big5ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Big5Summary | null>(null);
  const [intake, setIntake] = useState<IntakeSummary | null>(null);
  const [llmInsight, setLlmInsight] = useState<string | null>(null);
  const [llmBusy, setLlmBusy] = useState(false);

  const reveal = useReveal();

  // Load Big5 + Intake in parallel
  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const [big5, intakeSum] = await Promise.all([
          loadBig5Summary(user, rid),
          loadIntakeSummary(user, rid),
        ]);
        setData(big5);
        setIntake(intakeSum ?? null);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load Big-5 results");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  // Build deterministic section (and keep as fallback if LLM not available)
  const section: Big5Section | null = useMemo(
    () => (data ? generateBig5Section(data) : null),
    [data]
  );

  // Metrics for bars / chips / graphs (unconditional hook)
  const metrics = useMemo(() => {
    if (!data)
      return [] as Array<{
        key: Big5Key;
        value: number;
        mean: number;
        sd: number;
        z: number;
        p: number;
      }>;
    const order: Big5Key[] = ["O", "C", "E", "A", "N"];
    return order.map((k) => {
      const value = data.avg[k] ?? 0;
      const { mean, sd } = POP_STATS[k];
      const z = toZ(value, mean, sd);
      const p = zToPercentile(z);
      return { key: k, value, mean, sd, z, p };
    });
  }, [data]);

  // Optional: fetch an LLM interpretation for top-3 combo (graceful fallback)
  useEffect(() => {
    if (!data) return;
    (async () => {
      try {
        setLlmBusy(true);
        // If you have an API, plug it in here. Fallback to deterministic copy if it fails.
        // Example (adjust to your API):
        // const token = await user!.getIdToken();
        // const res = await fetch(`/api/llm/big5-insight?rid=${encodeURIComponent(rid)}`, {
        //   headers: { Authorization: 'Bearer ' + token },
        // });
        // if (res.ok) {
        //   const j = await res.json();
        //   setLlmInsight(String(j.text || "").trim() || null);
        // }
      } catch {
        /* ignore */
      } finally {
        setLlmBusy(false);
      }
    })();
  }, [data, rid]);

  // Safe early returns (after all hooks)
  if (loading || busy)
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center text-gray-600 text-lg">
        Loading your Big-5 profile…
      </div>
    );
  if (error)
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center text-red-700">
        {error}
      </div>
    );
  if (!data || !section) return null;

  // Trait values map for graphs
  const shape: Big5Shape = {
    O: data.avg.O ?? 0,
    C: data.avg.C ?? 0,
    E: data.avg.E ?? 0,
    A: data.avg.A ?? 0,
    N: data.avg.N ?? 0,
  };

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-16 space-y-12 transition-all ${reveal}`}
    >
      <FadeBlock index={-1}>
        <ReportNav rid={rid} />
      </FadeBlock>
      {/* HEADER */}
      <div className="flex flex-col items-center space-y-6 text-center">
        <FadeBlock index={0}>
          <h1 className="text-4xl font-semibold text-gray-900">
            Let’s take a closer look at your personality
            {intake?.name ? `, ${intake.name}` : ""}.
          </h1>
        </FadeBlock>
        <FadeBlock index={1}>
          <p className="text-[1.3rem] text-gray-700">
            Your{" "}
            <span className="text-gradient font-semibold">Big-5 Profile</span>{" "}
            highlights the tendencies that shape how you think, feel, and work.
          </p>
        </FadeBlock>
      </div>

      {/* INTRO (from generator) */}
      <FadeBlock index={2}>
        <p className="text-gray-700 text-[1.15rem] leading-relaxed text-center max-w-2xl mx-auto">
          {section.intro}
        </p>
      </FadeBlock>

      {/* TRAIT SECTIONS */}
      <section className="space-y-10">
        {metrics.map((m, i) => {
          const header = LABELS[m.key];
          const ui = TRAIT_UI[m.key];
          return (
            <FadeBlock key={m.key} index={i + 3}>
              <div className="space-y-3 border-b border-gray-200 pb-8 last:border-none">
                <h3 className={`text-xl font-semibold ${ui.text}`}>{header}</h3>

                {/* personalised interpretation - now above chart */}
                <p className="text-[1.1rem] text-gray-800 leading-relaxed font-medium">
                  {TRAIT_INTERP[m.key](m.value)}
                </p>

                {/* graph */}
                <GraphCard title="Your result" className={ui.ring}>
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-700">{header}</span>
                    <span className="tabular-nums text-gray-600">
                      {m.value.toFixed(2)}
                    </span>
                  </div>
                  <Bar value={m.value} popMean={m.mean} color={ui.bar} />
                </GraphCard>

                {/* explanation / definition - moved below chart */}
                <p className="text-gray-700 text-[0.95rem] leading-relaxed">
                  {TRAIT_DEFS[m.key]}
                </p>

                {/* quick stats row */}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-gray-700 text-sm">
                  <TrendChip z={m.z} />
                  <PercentileChip p={m.p} />
                  <span className="text-gray-600">
                    Your score {m.value.toFixed(2)} • Avg {m.mean.toFixed(2)} •
                    SD {m.sd.toFixed(2)} — you’re
                    {m.z >= 0 ? " above " : " below "}
                    about {m.p}% of people.
                  </span>
                </div>
              </div>
            </FadeBlock>
          );
        })}
      </section>

      {/* OVERALL SUMMARY VISUALS */}
      <FadeBlock index={10}>
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 text-center">
            The overall picture
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <GraphCard title="All traits at a glance">
              <MiniStackBars traits={shape} />
            </GraphCard>
            <GraphCard title="Profile radar">
              <RadarChart traits={shape} />
              <p className="text-xs text-gray-500 mt-2">
                Each point shows your score (1–5). Closer to the edge = higher
                on that trait.
              </p>
            </GraphCard>
          </div>
        </section>
      </FadeBlock>

      {/* COMBINED INSIGHT (LLM optional) */}
      <FadeBlock index={11}>
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            What it all means
          </h2>
          <p className="text-gray-700 text-[1.1rem] leading-relaxed max-w-2xl mx-auto">
            {llmInsight && !llmBusy ? llmInsight : section.combinedInsight}
          </p>
          {llmBusy ? (
            <p className="text-xs text-gray-500">Generating a brief insight…</p>
          ) : null}
        </section>
      </FadeBlock>

      {/* NAV */}
      <FadeBlock index={12}>
        <div className="text-center pt-10">
          <button
            onClick={() => router.push(`/app/report/riasec?rid=${rid}`)}
            className="btn btn-primary text-lg font-semibold"
            style={{
              background:
                "linear-gradient(90deg,var(--sky-400),var(--mint-400))",
              border: "none",
              boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
            }}
          >
            ← Back: RIASEC Analysis
          </button>{" "}
          <button
            onClick={() => router.push(`/app/report/values?rid=${rid}`)}
            className="btn btn-primary text-lg font-semibold"
            style={{
              background:
                "linear-gradient(90deg,var(--mint-400),var(--sky-400))",
              border: "none",
              boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
            }}
          >
            Next: Work Values →
          </button>
        </div>
      </FadeBlock>
    </div>
  );
}
