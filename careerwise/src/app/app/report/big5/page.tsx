// src/app/app/report/big5/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadBig5Summary } from "@/app/lib/results/loaders/map-big5";
import type { Big5Summary, Big5Key } from "@/app/lib/results/loaders/map-big5";

const LABELS: Record<Big5Key, string> = {
  O: "Openness (O)",
  C: "Conscientiousness (C)",
  E: "Extraversion (E)",
  A: "Agreeableness (A)",
  N: "Neuroticism (N)",
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

/** Horizontal bar (for 1–5 scale) */
function TraitBar({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number; // 1..5
  highlight?: boolean;
}) {
  const pct = Math.min(100, (value / 5) * 100); // fixed 1–5 scale
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold" : ""}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
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

export default function Big5ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Big5Summary | null>(null);

  const reveal = useReveal();

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await loadBig5Summary(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load Big-5 results");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  // ---- hooks above any early returns ----
  const scores = data?.scores ?? [];          // [{ key, avg, sum, count }]
  const topKeys = data?.top3 ?? ([] as Big5Key[]); // already ["O","C","E"]
  const topString = useMemo(() => topKeys.join(" - "), [topKeys]);

  const TRAIT_BLURBS: Record<Big5Key, string> = {
    O: "Curious, creative, enjoys ideas and variety.",
    C: "Organized, reliable, prefers structure and follow-through.",
    E: "Energized by people, stimulation, and outward impact.",
    A: "Cooperative, empathetic, team-oriented and supportive.",
    N: "Emotionally sensitive; benefits from stability and healthy coping.",
  };

  // ---- safe early returns ----
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Loading your Big-5 profile…
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>
    );
  }
  if (!data) return null;

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}
    >
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your Big-5 Personality
        </h1>
        <p className="text-gray-600">
          A high-level view of your dispositional tendencies at work.
        </p>
      </header>

      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Overview</h2>
        <p className="text-sm text-gray-700">
          Your standout traits are <strong>{topString}</strong>. These
          tendencies shape your work style, collaboration preferences, and how
          you approach learning and problem-solving.
        </p>
        <ul className="mt-3 grid sm:grid-cols-3 gap-3 text-sm text-gray-700">
          {topKeys.map((k) => (
            <li key={k} className="rounded-lg border p-3 bg-[--surface]">
              <div className="font-medium mb-1">{LABELS[k]}</div>
              <div className="text-gray-600">{TRAIT_BLURBS[k]}</div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border p-6 bg-white shadow-sm space-y-3">
        <h2 className="text-xl font-semibold">Scores</h2>
        <div className="grid grid-cols-1 gap-3">
          {scores.map((s) => (
            <TraitBar
              key={s.key}
              label={LABELS[s.key]}
              value={s.avg}            // 1–5 mean from scorer
              highlight={topKeys.includes(s.key)}
            />
          ))}
        </div>
      </section>

      <div className="text-center">
        <button
          onClick={() => router.push(`/app/report/overview?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: Integrated Overview →
        </button>
      </div>
    </div>
  );
}