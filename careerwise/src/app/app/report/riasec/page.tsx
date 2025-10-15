// src/app/app/report/riasec/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadRiasecSummary } from "@/app/lib/results/loaders/map-riasec";
import type { RIASECResult } from "@/app/lib/results/loaders/map-riasec";
import type { RIASECProfile } from "@/app/lib/results/types";

type RIASECKey = keyof RIASECProfile; // 'R' | 'I' | 'A' | 'S' | 'E' | 'C'

const LABELS: Record<RIASECKey, string> = {
  R: "Realistic (R)",
  I: "Investigative (I)",
  A: "Artistic (A)",
  S: "Social (S)",
  E: "Enterprising (E)",
  C: "Conventional (C)",
};

/** Quick fade-in */
function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), 20);
    return () => clearTimeout(t);
  }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

/** Bar for each dimension */
function RIASECBar({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  // assuming 60 is your current max after aggregation
  const pct = Math.min(100, (value / 60) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold" : ""}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(0)}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            highlight
              ? "bg-gradient-to-r from-cyan-400 to-violet-500"
              : "bg-gray-700"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function RiasecResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [data, setData] = useState<RIASECResult | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  /** --------- IMPORTANT: Hooks must be unconditional ---------- */
  // Safe fallbacks so hooks (useMemo below) run on every render.
  const safeTopKeys: RIASECKey[] = (data?.top3 ?? []).map((t) => t.key as RIASECKey);


  // TODO! Replace with real data-driven clusters
  // Map top RIASEC type to some example industries
  const matchingIndustries = useMemo(() => {
    const first = safeTopKeys[0];
    switch (first) {
      case "A":
        return ["Arts & Media", "Design", "Writing"];
      case "I":
        return ["Science", "Research", "Engineering"];
      case "S":
        return ["Education", "Counselling", "Healthcare"];
      case "E":
        return ["Entrepreneurship", "Sales", "Management"];
      case "R":
        return ["Trades", "Mechanics", "Outdoors"];
      case "C":
        return ["Finance", "Administration", "Operations"];
      default:
        return ["General exploration"];
    }
  }, [safeTopKeys]);

  // Early returns (AFTER all hooks above)
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

  const { scores, top3 } = data;
  const topKeys = top3.map((t) => t.key);
  const topString = top3.map((t) => t.key).join(" - ");

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}
    >
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your RIASEC Profile
        </h1>
        <p className="text-gray-600">
          Your pattern of interests shows where you feel most energized.
        </p>
      </header>

      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Overview</h2>
        <p className="text-sm text-gray-700">
          Your top areas are <strong>{topString}</strong>. These represent the
          core themes in how you approach work, learning, and creativity.
        </p>
      </section>

      <section className="rounded-2xl border p-6 bg-white shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Scores</h2>
        <div className="grid grid-cols-1 gap-3">
          {scores.map((s) => (
            <RIASECBar
              key={s.key}
              label={LABELS[s.key]}
              value={s.value}
              highlight={topKeys.includes(s.key)}
            />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Best-fit Clusters</h2>
        <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
          {matchingIndustries.map((ind) => (
            <li key={ind}>{ind}</li>
          ))}
        </ul>
        <p className="text-xs text-gray-500 mt-2">
          (These will later be replaced by LLM-driven, data-grounded
          recommendations.)
        </p>
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