// src/app/app/results/big5/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

type Big5 = { E:number; A:number; C:number; N:number; O:number };
type Big5Result = { traits: Big5; computedAt: string };

// --- Population reference (IPIP/BFI-aligned) ---
const POP_STATS: Record<keyof Big5, { mean:number; sd:number }> = {
  E: { mean: 3.20, sd: 0.75 },
  A: { mean: 3.60, sd: 0.60 },
  C: { mean: 3.50, sd: 0.70 },
  N: { mean: 3.00, sd: 0.80 },
  O: { mean: 3.60, sd: 0.65 },
};

const LABELS: Record<keyof Big5, string> = {
  E: 'Extraversion',
  A: 'Agreeableness',
  C: 'Conscientiousness',
  N: 'Neuroticism',
  O: 'Openness',
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
  // Abramowitz-Stegun style approx
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

// --- Small UI atoms ---
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

function TraitInfoBox({ traitKey }: { traitKey: keyof Big5 }) {
  const info: Record<keyof Big5, { short: string; full: string }> = {
    E: {
      short: 'How outgoing & social you are.',
      full: '\nHigher Extraversion often means energy from social settings and fast-paced environments. \nLower Extraversion means you recharge alone and think deeply before engaging.',
    },
    A: {
      short: 'How compassionate & cooperative you are.',
      full: '\nHigh Agreeableness shows warmth, empathy, and cooperation. \nLower Agreeableness brings a more direct, assertive, and independent style — useful when tough calls are needed.',
    },
    C: {
      short: 'How organized & disciplined you are.',
      full: '\nHigh Conscientiousness means reliability, planning, and persistence. \nLower Conscientiousness often signals flexibility, spontaneity, and comfort with uncertainty.',
    },
    N: {
      short: 'How emotionally steady you are.',
      full: '\nHigher Neuroticism reflects greater emotional sensitivity — you feel things deeply. \nLower Neuroticism reflects calm and emotional steadiness, even in stress.',
    },
    O: {
      short: 'How curious & open-minded you are.',
      full: '\nHigh Openness means creativity, imagination, and a hunger for new ideas. \nLower Openness often means groundedness, tradition, and comfort in what’s known.',
    },
  };

  const copy = info[traitKey];

  return (
    <div className="absolute inset-0 hidden group-hover:flex items-center justify-center 
                    bg-white/95 backdrop-blur-sm rounded-xl shadow-xl p-5 text-center 
                    text-sm text-gray-700 transition-opacity duration-300">
      <div>
        <div className="font-semibold mb-1">{copy.short}</div>
        <div className="text-xs leading-snug text-gray-600 whitespace-pre-line">{copy.full}</div>
      </div>
    </div>
  );
}

function Bar({
  label,
  value,
  popMean,
  highlight,
}: {
  label: string;
  value: number;
  popMean: number;
  highlight?: boolean;
}) {
  const pct = pctFrom1to5(value);
  const meanPct = pctFrom1to5(popMean);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={highlight ? 'font-semibold' : ''}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${highlight ? 'bg-gradient-to-r from-cyan-400 to-violet-500' : 'bg-gray-800'}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.08)]"
          style={{ left: `${meanPct}%` }}
          title="Population average"
        />
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-600">
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-gray-800" />
          Your score
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="inline-block h-2 w-0.5 bg-gray-400" />
          Avg ({popMean.toFixed(2)})
        </span>
      </div>
    </div>
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

  // ---- IMPORTANT: all hooks below are UNCONDITIONAL ----

  // Use safe defaults so hooks run even before data arrives
  const traits: Big5 = result?.traits ?? { E:0, A:0, C:0, N:0, O:0 };

  const metrics = useMemo(() => {
    return (Object.keys(traits) as (keyof Big5)[]).map((k) => {
      const { mean, sd } = POP_STATS[k];
      const val = traits[k];
      const z = toZ(val, mean, sd);
      const p = zToPercentile(z);
      const delta = val - mean;
      return { key: k, label: LABELS[k], value: val, mean, sd, z, p, delta };
    });
  }, [traits]);

  const sortedByAbs = useMemo(() => {
    return [...metrics].sort((a, b) => Math.abs(b.z) - Math.abs(a.z));
  }, [metrics]);

  const topSignal = sortedByAbs[0] ?? null;

  const summary = useMemo(() => {
    if (!topSignal) {
      return 'Here’s a concise snapshot of your Big-5 pattern compared to the general population.';
    }
    const dir = topSignal.z >= 0 ? 'above' : 'below';
    const abs = Math.abs(topSignal.z).toFixed(2);
    const pct = topSignal.p;
    return `Your strongest signal is ${topSignal.label}, at about ${abs}σ ${dir} average (${pct}th percentile). The rest of your profile rounds out a balanced picture — use these as tendencies, not boxes.`;
  }, [topSignal]);

  // Now render conditionally (after hooks are declared)
  if (loading || busy) {
    return <div className="max-w-3xl mx-auto py-10 px-4">Loading…</div>;
  }
  if (err) {
    return <div className="max-w-3xl mx-auto py-10 px-4 text-red-600">{err}</div>;
  }
  if (!result) {
    // Show nothing if fetch hasn’t populated yet (shouldn’t hit because of busy flag, but safe)
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Your Big-5 Personality</h1>
        <p className="text-sm text-gray-600">
          Computed on {result?.computedAt ? new Date(result.computedAt).toLocaleString() : '—'}
        </p>
      </header>

      {/* Summary */}
      <div className="rounded-2xl border p-5 bg-white">
        <p className="text-gray-800 leading-relaxed">{summary}</p>
        <p className="text-xs text-gray-500 mt-2">
          Scores: 1–5 scale. Marker shows population mean. σ = standard deviations from average; percentiles are approximate based on normal distribution.
        </p>
      </div>

      {/* Trait display */}
      <div className="grid gap-4">
        {metrics.map((m) => (
          <div key={m.key} className="group relative rounded-xl border p-4 bg-white hover:shadow-lg transition-all duration-300">
            <Bar
              label={`${m.label} (${m.key})`}
              value={m.value}
              popMean={m.mean}
              highlight={m.key === topSignal?.key}
            />
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-gray-700">
              <TrendChip z={m.z} />
              <PercentileChip p={m.p} />
              <span className="text-gray-500">
                mean {m.mean.toFixed(2)} • sd {m.sd.toFixed(2)}
              </span>
            </div>

            {/* Hover overlay */}
            <TraitInfoBox traitKey={m.key} />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between">
        <a href="/app" className="btn btn-ghost">Back to dashboard</a>
        <a href={`/app/results?rid=${encodeURIComponent(sp.get('rid') || '')}`} className="btn btn-primary">
          See full report
        </a>
      </div>
    </div>
  );
}