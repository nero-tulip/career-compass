// src/app/app/report/team-role/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateTeamRole } from "@/app/lib/results/generators/generate-team-roles";
import type { TeamRoleSummary } from "@/app/lib/results/generators/generate-team-roles";
import ReportNav from "@/app/components/ReportNav";

/** Quick fade-in */
function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), 20);
    return () => clearTimeout(t);
  }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700 bg-[--surface]">
      {children}
    </span>
  );
}

/** Badge coloring by confidence */
function ConfidenceBadge({
  level,
}: {
  level: "high" | "likely" | "mixed" | undefined;
}) {
  const label =
    level === "high"
      ? "High confidence"
      : level === "likely"
      ? "Likely"
      : "Mixed signals";

  const colorClass =
    level === "high"
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
      : level === "likely"
      ? "bg-amber-100 text-amber-800 border border-amber-200"
      : "bg-slate-100 text-slate-800 border border-slate-200";

  return (
    <span className={`rounded-full text-xs px-2 py-1 ${colorClass}`}>
      {label}
    </span>
  );
}

export default function TeamRolePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TeamRoleSummary | null>(null);

  const reveal = useReveal();

  /** Load role data once user is ready */
  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const res = await generateTeamRole(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to derive team role.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  /** Default empty safe object (avoids conditional errors below) */
  const safe = data ?? {
    roleKey: "explorer",
    label: "",
    tagline: "",
    confidence: "mixed" as const,
    rationale: "",
    signals: [],
    strengths: [],
    friction: [],
    complements: [],
    tips: [],
  };

  /** Render signals as pills */
  const signalChips = useMemo(
    () =>
      (safe.signals ?? []).map((s, i) => (
        <Pill key={`${s.from}-${i}`}>
          <span className="text-gray-500">{s.from}</span>&nbsp;{s.signal}
        </Pill>
      )),
    [safe.signals]
  );

  /** Loading / error states */
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Loading your team role…
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>
    );
  }
  if (!data) return null;

  /** Main render */
  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}
    >
      {/* NAV */}
      <ReportNav rid={rid} />
      
      {/* HEADER */}
      <header className="space-y-1 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Team Role & Collaboration
        </h1>
        <p className="text-gray-600">
          How you naturally operate in groups — and how to get the most from
          your style.
        </p>
      </header>

      {/* Role card */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{safe.label}</h2>
            {safe.tagline ? (
              <div className="text-sm text-gray-600 mt-0.5">
                {safe.tagline}
              </div>
            ) : null}
          </div>
          <ConfidenceBadge level={safe.confidence} />
        </div>
        <p className="mt-3 text-gray-800">{safe.rationale}</p>

        {/* Signals */}
        {signalChips.length ? (
          <div className="mt-4 flex flex-wrap gap-2">{signalChips}</div>
        ) : null}
      </section>

      {/* Strengths / Friction / Complements */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold">Strengths you bring</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-800 space-y-1">
            {(safe.strengths ?? []).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold">Watchouts to manage</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-800 space-y-1">
            {(safe.friction ?? []).map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h3 className="text-lg font-semibold">Best complements</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-gray-800 space-y-1">
            {(safe.complements ?? []).map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      </section>

      {/* Tips */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h3 className="text-lg font-semibold">Tips for working at your best</h3>
        <ul className="mt-2 list-disc pl-5 text-sm text-gray-800 space-y-1">
          {(safe.tips ?? []).map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </section>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => router.push(`/app/report/motivations?rid=${rid}`)}
          className="btn btn-ghost"
        >
          ← Back: Motivations
        </button>
        <button
          onClick={() => router.push(`/app/report/environment?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: Ideal Environment →
        </button>
      </div>
    </div>
  );
}