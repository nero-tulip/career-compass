// src/app/app/report/riasec/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadRiasecSummary } from "@/app/lib/results/loaders/map-riasec";
import type { RIASECSummary, RIASECKey } from "@/app/lib/results/loaders/map-riasec";

// Core RIASEC labels and color codes
const LABELS: Record<RIASECKey, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

const TRAIT_COLORS: Record<RIASECKey, string> = {
  R: "bg-amber-500",
  I: "bg-sky-500",
  A: "bg-violet-500",
  S: "bg-emerald-500",
  E: "bg-rose-500",
  C: "bg-indigo-500",
};

const TRAIT_DESC: Record<RIASECKey, string> = {
  R: "Hands-on, practical, and tactile. You enjoy working with tools, materials, or physical results.",
  I: "Curious, analytical, and systems-minded. You like solving problems and understanding how things work.",
  A: "Creative, expressive, and original. You value design, writing, and imagination.",
  S: "Supportive and collaborative. You enjoy helping others learn and grow.",
  E: "Dynamic and opportunity-seeking. You like leading, persuading, and taking initiative.",
  C: "Organized, structured, and detail-oriented. You like making systems run efficiently.",
};

// Smooth fade-in
function useReveal() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 20);
    return () => clearTimeout(t);
  }, []);
  return shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

function TraitBar({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number; // 1–5
  color: string;
  highlight?: boolean;
}) {
  const pct = Math.min(100, (value / 5) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold" : ""}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            highlight
              ? "bg-gradient-to-r from-cyan-400 to-violet-500"
              : color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function RiasecReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RIASECSummary | null>(null);
  const reveal = useReveal();

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await loadRiasecSummary(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load RIASEC results");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  // Always safe hooks first
  const scores = data?.scores ?? [];
  const topKeys = data?.top3 ?? ([] as RIASECKey[]);
  const topString = useMemo(() => topKeys.join(" - "), [topKeys]);

  // UI states
  if (loading || busy)
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Loading your RIASEC profile…
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>
    );

  if (!data) return null;

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-12 space-y-10 transition-all ${reveal}`}
    >
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Your RIASEC Profile</h1>
        <p className="text-gray-600">
          A snapshot of where your interests and motivation tend to peak.
        </p>
      </header>

      {/* Overview */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Overview</h2>
        <p className="text-sm text-gray-700">
          Your top areas are <strong>{topString}</strong>. These patterns
          reflect the kinds of work and environments that naturally energize
          you.
        </p>
      </section>

      {/* Per-trait summary */}
      <section className="space-y-5">
        {scores.map((s) => (
          <div key={s.key} className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">
              {LABELS[s.key]} ({s.key})
            </h3>
            <p className="text-sm text-gray-700">{TRAIT_DESC[s.key]}</p>
            <TraitBar
              label={LABELS[s.key]}
              value={s.avg}
              color={TRAIT_COLORS[s.key]}
              highlight={topKeys.includes(s.key)}
            />
          </div>
        ))}
      </section>

      {/* Top-3 summary */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Top Interests</h2>
        <ul className="grid sm:grid-cols-3 gap-3 text-sm text-gray-700">
          {topKeys.map((k) => (
            <li key={k} className="rounded-lg border p-3 bg-[--surface]">
              <div className="font-medium mb-1">{LABELS[k]}</div>
              <div className="text-gray-600">{TRAIT_DESC[k]}</div>
            </li>
          ))}
        </ul>
      </section>

      <div className="text-center">
        <button
          onClick={() => router.push(`/app/report/big5?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: Big-5 Personality →
        </button>
      </div>
    </div>
  );
}