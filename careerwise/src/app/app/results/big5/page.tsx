// src/app/app/results/big5/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

type Big5 = { E:number; A:number; C:number; N:number; O:number };
type Big5Result = { traits: Big5; computedAt: string };

// --- Population reference (IPIP/BFI-aligned; approximate) ---
const POP_STATS: Record<keyof Big5, { mean:number; sd:number }> = {
  E: { mean: 3.20, sd: 0.75 },
  A: { mean: 3.60, sd: 0.60 },
  C: { mean: 3.50, sd: 0.70 },
  N: { mean: 3.00, sd: 0.80 },
  O: { mean: 3.60, sd: 0.65 },
};

const LABELS: Record<keyof Big5, string> = {
  O: 'Openness',
  C: 'Conscientiousness',
  E: 'Extraversion',
  A: 'Agreeableness',
  N: 'Neuroticism',
};

// Per-trait UI colors (Tailwind utility classes)
// Tweak any of these to match your globals.css palette.
const TRAIT_UI: Record<keyof Big5, {
  text: string;   // headers / labels
  bar: string;    // filled bars
  ring: string;   // light borders/backgrounds
  axis: string;   // radar axis labels
}> = {
  O: { text: 'text-sky-700',       bar: 'bg-sky-500',       ring: 'border-sky-200',       axis: 'text-sky-600' },
  C: { text: 'text-emerald-700',   bar: 'bg-emerald-500',   ring: 'border-emerald-200',   axis: 'text-emerald-600' },
  E: { text: 'text-amber-700',     bar: 'bg-amber-500',     ring: 'border-amber-200',     axis: 'text-amber-600' },
  A: { text: 'text-violet-700',    bar: 'bg-violet-500',    ring: 'border-violet-200',    axis: 'text-violet-600' },
  N: { text: 'text-rose-700',      bar: 'bg-rose-500',      ring: 'border-rose-200',      axis: 'text-rose-600' },
};

// Plain-English trait definitions (what the trait *is*)
const TRAIT_DEFS: Record<keyof Big5, string> = {
  O: `Openness captures curiosity, imagination, and the hunger to experience new ideas and perspectives. 
People high in Openness are often drawn to creative fields — design, writing, philosophy, or entrepreneurship — 
where they can experiment and connect concepts in original ways. Think of people like Steve Jobs or Elon Musk, 
who constantly reimagine what’s possible. Those lower in Openness tend to prefer structure, clarity, and familiarity — 
they excel in stable environments that reward expertise and precision, like accounting, engineering, or law. 
Neither is “better”; one explores new worlds, the other perfects the existing one.`,

  C: `Conscientiousness is about self-discipline, organization, and reliability — the quiet engine behind consistency and follow-through. 
Highly conscientious people are planners, finishers, and caretakers of detail. They often thrive in roles requiring trust and precision — 
project management, medicine, finance, or leadership. You might picture someone like Tim Cook: dependable, meticulous, and calm under pressure. 
Those lower in Conscientiousness often prefer freedom and adaptability; they can be innovators, artists, or problem-solvers who see 
possibilities others miss because they’re not locked into rigid systems. High conscientiousness builds stability; low conscientiousness creates flexibility.`,

  E: `Extraversion reflects social energy and stimulation-seeking — how much you recharge through people, excitement, and movement. 
High extraverts tend to shine in visible or fast-paced environments like sales, events, media, or leadership — they thrive on interaction and momentum. 
Someone like Richard Branson or Oprah Winfrey radiates this trait. Introverted types, on the other hand, draw energy from reflection and solitude. 
They often excel in research, writing, programming, or strategy — work that rewards depth over breadth. 
Neither side is superior: extraversion builds community and visibility, introversion builds focus and insight.`,

  A: `Agreeableness measures empathy, cooperation, and the instinct to create harmony with others. 
People high in Agreeableness are kind, collaborative, and trustworthy — the glue in teams and relationships. 
They often succeed in helping professions like healthcare, education, therapy, or HR, where people skills are essential. 
Think of Fred Rogers or Keanu Reeves — warm, patient, and quietly strong. 
Those lower in Agreeableness tend to be more direct, assertive, and competitive — strengths in negotiation, law, politics, or leadership, 
where tough decisions and firm boundaries are essential. High Agreeableness builds trust; low Agreeableness drives progress.`,

  N: `Neuroticism reflects emotional sensitivity — how deeply you experience stress, mood changes, or worry. 
It’s often misunderstood as “bad,” but it’s really about responsiveness to the emotional world. 
People higher in Neuroticism often notice small shifts in tone, risk, or tension before others do — a gift in creative work, 
crisis response, or any role needing emotional awareness. Many great artists and innovators channel this sensitivity into passion and empathy. 
Lower-Neuroticism individuals are calm and steady under pressure, grounding others during chaos — traits valuable in leadership, 
operations, or medicine. High emotional awareness creates connection; low emotional reactivity creates stability.` 
};

// --- Utility helpers ---
function pctFrom1to5(v: number) {
  return Math.max(0, Math.min(100, Math.round((v / 5) * 100)));
}
function toZ(score: number, mean: number, sd: number) {
  if (!sd) return 0;
  return (score - mean) / sd;
}
function zToPercentile(z: number) {
  // Abramowitz–Stegun normal CDF approximation
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

// --- UI atoms ---
function TrendChip({ z }: { z: number }) {
  const abs = Math.abs(z);
  const sign = z >= 0 ? '+' : '−';
  const sigma = `${sign}${abs.toFixed(2)}σ`;
  const tone =
    abs >= 1.5 ? 'text-violet-700 bg-violet-50' :
    abs >= 0.5 ? 'text-sky-700 bg-sky-50' :
                 'text-gray-700 bg-gray-100';
  return (
    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tone} border border-black/5`}>
      {sigma}
    </span>
  );
}

function PercentileChip({ p }: { p:number }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-black text-white">
      {p}th percentile
    </span>
  );
}

function GraphCard({ children, title, className }: { children: React.ReactNode; title?: string; className?: string }) {
  return (
    <div className={`rounded-xl border bg-white p-4 shadow-sm border-gray-200 ${className || ''}`}>
      {title ? <div className="text-sm font-medium mb-2">{title}</div> : null}
      {children}
    </div>
  );
}

function Bar({
  value,
  popMean,
  color = 'bg-gray-800',
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
          className={`h-full transition-all duration-500 ease-out ${highlight ? 'bg-gradient-to-r from-cyan-400 to-violet-500' : color}`}
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

// Overall visuals
function MiniStackBars({ traits }: { traits: Big5 }) {
  const keys: (keyof Big5)[] = ['O','C','E','A','N'];
  return (
    <div className="grid gap-3">
      {keys.map(k => {
        const v = traits[k] ?? 0;
        const mean = POP_STATS[k].mean;
        return (
          <div key={k} className="flex items-center gap-3">
            <div className={`w-28 text-xs ${TRAIT_UI[k].text}`}>{LABELS[k]} ({k})</div>
            <div className="flex-1">
              <Bar value={v} popMean={mean} color={TRAIT_UI[k].bar} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RadarChart({ traits }: { traits: Big5 }) {
  // OCEAN around the circle
  const order: (keyof Big5)[] = ['O','C','E','A','N'];
  const cx = 120, cy = 120, rMax = 90; // viewBox 240x240
  const angleFor = (i: number) => (-Math.PI / 2) + (i * 2 * Math.PI / order.length);
  const point = (i: number, val: number) => {
    const ratio = Math.max(0, Math.min(1, val / 5));
    const r = ratio * rMax;
    const a = angleFor(i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const pts = order.map((k, i) => point(i, traits[k] ?? 0));
  const pathD = pts.map((p, i) => `${i===0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + ' Z';

  const rings = [1,2,3,4,5].map(n => ({
    r: (n/5)*rMax,
    label: n
  }));

  return (
    <svg viewBox="0 0 240 240" className="w-full h-auto">
      {/* rings */}
      {rings.map((g, idx) => (
        <circle key={idx} cx={cx} cy={cy} r={g.r} fill="none" stroke="#E5E7EB" strokeWidth={1}/>
      ))}
      {/* spokes */}
      {order.map((_, i) => {
        const [x, y] = [cx + rMax * Math.cos(angleFor(i)), cy + rMax * Math.sin(angleFor(i))];
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#E5E7EB" strokeWidth={1} />
      })}
      {/* polygon */}
      <path d={pathD} fill="rgba(99,102,241,0.20)" stroke="rgba(99,102,241,0.8)" strokeWidth={2} />
      {/* labels (colored per trait) */}
      {order.map((k, i) => {
        const [x, y] = [cx + (rMax + 14) * Math.cos(angleFor(i)), cy + (rMax + 14) * Math.sin(angleFor(i))];
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

// --- Main page ---
export default function Big5ResultPage() {
  const sp = useSearchParams();
  const rid = sp.get('rid') || '';
  const { user, loading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<Big5Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Fetch results once
  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!user) return router.replace('/login?next=/app/results/big5');
      try {
        setBusy(true);
        setErr(null);
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/results/section?rid=${encodeURIComponent(rid)}&section=big5`,
          { headers: { Authorization: 'Bearer ' + token } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setResult(data.result as Big5Result);
      } catch (e:any) {
        setErr(e.message || 'Failed to load Big-5 results.');
      } finally {
        setBusy(false);
      }
    })();
  }, [user, loading, rid, router]);

  // ---- Unconditional hooks below ----
  const traits: Big5 = result?.traits ?? { E:0, A:0, C:0, N:0, O:0 };

  // Build per-trait metrics in OCEAN order
  const metrics = useMemo(() => {
    const order: (keyof Big5)[] = ['O','C','E','A','N'];
    return order.map((k) => {
      const { mean, sd } = POP_STATS[k];
      const val = traits[k] ?? 0;
      const z = toZ(val, mean, sd);
      const p = zToPercentile(z);
      const delta = val - mean;
      return { key: k, label: LABELS[k], value: val, mean, sd, z, p, delta };
    });
  }, [traits]);

  // Friendly intro (no border; report-like)
  const intro =
    "The Big Five is a well-researched framework used by psychologists for decades. It looks at five broad tendencies — Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism — to describe how people typically think, feel, and work. These aren’t boxes, just patterns; they help you notice strengths and likely blind spots so you can make better choices about your environment and habits.";

  // Empathetic per-trait interpretation
  const TRAIT_PARAS: Record<keyof Big5, (v:number)=>string> = {
    O: (v) =>
      v >= 3.5
        ? "You likely enjoy new ideas, variety, and creative problem-solving. Curious minds like yours often thrive when you can explore and connect dots."
        : "You probably value clarity, traditions, and tried-and-true approaches. That steadiness can be a strength—especially where reliability and consistency matter.",
    C: (v) =>
      v >= 3.5
        ? "You tend to plan ahead, follow through, and keep things organized. People who score like you often feel best with clear goals and systems that support them."
        : "You may prefer flexibility and room to move. Spontaneity can spark momentum—short, simple plans and gentle structure often work better than rigid routines.",
    E: (v) =>
      v >= 3.5
        ? "You likely gain energy from people and fast-moving environments. Collaboration, talking ideas out, and visible progress can light you up."
        : "You may recharge solo and think deeply before jumping in. Calm spaces, focus time, and written communication can help you do your best work.",
    A: (v) =>
      v >= 3.5
        ? "You probably lead with warmth and empathy. People like you build trust quickly and smooth tensions, which is powerful on teams and with clients."
        : "You may be more direct and independent. That clarity helps in tough decisions—pair it with curiosity and you’ll navigate disagreements well.",
    N: (v) =>
      v >= 3.5
        ? "You might feel emotions strongly and notice stress signals sooner. That sensitivity can be a strength—pair it with grounding routines and clear boundaries."
        : "You tend to stay steady under pressure. Your calm presence can stabilize projects and people, especially when things get messy.",
  };

  if (loading || busy) return <div className="max-w-3xl mx-auto py-10 px-4">Loading…</div>;
  if (err) return <div className="max-w-3xl mx-auto py-10 px-4 text-red-600">{err}</div>;
  if (!result) return null;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your Big-5 Personality</h1>
        <p className="text-sm text-gray-600">
          Computed on {result?.computedAt ? new Date(result.computedAt).toLocaleString() : '—'}
        </p>
      </header>

      {/* Intro (no border) */}
      <section className="space-y-2">
        <p className="text-gray-800 leading-relaxed">{intro}</p>
        <p className="text-xs text-gray-500">
          Scores use a 1–5 scale. The thin marker on each bar shows a typical population average.
        </p>
      </section>

      {/* Per-trait sections (OCEAN): title -> definition -> graph (bordered) -> interpretation line */}
      {metrics.map((m) => (
        <section key={m.key} className="space-y-3">
          <h2 className={`text-xl font-semibold ${TRAIT_UI[m.key].text}`}>{m.label}</h2>

          {/* trait definition */}
          <p className="text-gray-800">
            {TRAIT_DEFS[m.key]}
          </p>

          {/* graph card (with light per-trait ring color) */}
          <GraphCard title="Your result" className={TRAIT_UI[m.key].ring}>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-700">{m.label} ({m.key})</span>
              <span className="tabular-nums text-gray-600">{m.value.toFixed(2)}</span>
            </div>
            <Bar value={m.value} popMean={m.mean} color={TRAIT_UI[m.key].bar} />
          </GraphCard>

          {/* interpretation */}
          <div className="text-sm text-gray-800">
            {TRAIT_PARAS[m.key](m.value)}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-gray-700">
              <TrendChip z={m.z} />
              <PercentileChip p={m.p} />
              <span className="text-gray-600">
                Your score {m.value.toFixed(2)} • Avg {m.mean.toFixed(2)} • SD {m.sd.toFixed(2)} — you’re
                {m.z >= 0 ? ' above ' : ' below '}
                about {m.p}% of people.
              </span>
            </div>
          </div>
        </section>
      ))}

      {/* Overall summary visuals (graphs inside light cards) */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Overall picture</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <GraphCard title="All traits at a glance">
            <MiniStackBars traits={traits} />
          </GraphCard>
          <GraphCard title="Profile radar">
            <RadarChart traits={traits} />
            <p className="text-xs text-gray-500 mt-2">
              Each point shows your score (1–5). Closer to the edge = higher on that trait.
            </p>
          </GraphCard>
        </div>
      </section>

      {/* Gentle wrap-up (no border) */}
      <section>
        <p className="text-gray-800 leading-relaxed">
          No single trait defines you. Think of this as your starting map: lean into the parts that help you
          do your best work, and build small habits to balance the rest. You can revisit the Big-5 anytime.
        </p>
      </section>

      {/* Footer */}
      <div className="flex justify-between">
        <a href="/app" className="btn btn-ghost">Back to dashboard</a>
      </div>
    </div>
  );
}