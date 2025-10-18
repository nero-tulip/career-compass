"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

// Light ping to show what's available (no hard gating yet)
import {
  loadIntakeSummary,
  loadMacroSummary,
  loadRiasecSummary,
  loadBig5Summary,
} from "@/app/lib/results/loaders/client-loaders";

type SectionKey = "intake" | "macro" | "riasec" | "big5";
type Status = "ready" | "partial" | "missing";

function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), 16);
    return () => clearTimeout(t);
  }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2";
}

function Badge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700 bg-[--surface]">
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: Status }) {
  const map: Record<Status, { text: string; cls: string }> = {
    ready:   { text: "Ready",   cls: "bg-emerald-50 text-emerald-800 border-emerald-200" },
    partial: { text: "Partial", cls: "bg-amber-50 text-amber-800 border-amber-200" },
    missing: { text: "Missing", cls: "bg-rose-50 text-rose-800 border-rose-200" },
  };
  const m = map[status];
  return (
    <span className={`rounded-full text-xs px-2 py-0.5 border ${m.cls}`}>
      {m.text}
    </span>
  );
}

export default function ReportStartPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const reveal = useReveal();

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sections, setSections] = useState<Record<SectionKey, Status>>({
    intake: "missing",
    macro: "missing",
    riasec: "missing",
    big5: "missing",
  });

  // Fetch lightweight availability (non-blocking later pages)
  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const [i, m, r, b] = await Promise.all([
          loadIntakeSummary(user, rid).catch(() => undefined),
          loadMacroSummary(user, rid).catch(() => undefined),
          loadRiasecSummary(user, rid).catch(() => undefined),
          loadBig5Summary(user, rid).catch(() => undefined),
        ]);

        const statusFor = (v: any): Status => {
          if (!v) return "missing";
          // naive partial/ready heuristic
          if (Array.isArray(v?.scores) && v.scores.length === 0) return "partial";
          return "ready";
        };

        setSections({
          intake: i ? "ready" : "missing",
          macro: m ? "ready" : "missing",
          riasec: statusFor(r),
          big5: statusFor(b),
        });
      } catch (e: any) {
        setError(e?.message ?? "Failed to check report data.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  const allGood = useMemo(
    () =>
      sections.intake !== "missing" &&
      sections.macro !== "missing" &&
      sections.riasec !== "missing" &&
      sections.big5 !== "missing",
    [sections]
  );

  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Preparing your report…
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>
    );
  }

  return (
    <div className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}>
      {/* Title */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your Career Report</h1>
        <p className="text-gray-600">
          A personalized snapshot of who you are, how you work, and where you’re likely to thrive.
        </p>
      </header>

      {/* Hero / Intro */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm space-y-4">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">What you’ll get</h2>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>A concise summary of your situation and goals.</li>
            <li>Clear patterns from your interests (RIASEC) and personality (Big-5).</li>
            <li>Motivators, team role, and the environments where you’ll do your best work.</li>
            <li>Clusters and example roles to explore, plus a lightweight action plan.</li>
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-xl border p-4 bg-[--surface]">
            <div className="text-sm font-medium mb-1">Powered by your data</div>
            <div className="flex flex-wrap gap-2">
              <Badge label="Intake" />
              <Badge label="Macro preferences" />
              <Badge label="RIASEC" />
              <Badge label="Big-5" />
            </div>
            <p className="text-xs text-gray-600 mt-2">
              We combine these sources to synthesize patterns. You can retake or edit any section later.
            </p>
          </div>

          <div className="rounded-xl border p-4 bg-[--surface]">
            <div className="text-sm font-medium mb-1">Transparency & privacy</div>
            <p className="text-xs text-gray-600">
              This report is generated just for you. We explain why each recommendation appears and never sell your data.
            </p>
          </div>
        </div>
      </section>

      {/* Availability / Checklist */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">What we’re using</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Intake</span>
            <StatusPill status={sections.intake} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Macro preferences</span>
            <StatusPill status={sections.macro} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">RIASEC (interests)</span>
            <StatusPill status={sections.riasec} />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <span className="text-sm">Big-5 (personality)</span>
            <StatusPill status={sections.big5} />
          </div>
        </div>
        {allGood ? (
          <p className="mt-3 text-xs text-emerald-700">
            Looks good — we have enough to generate a strong first pass.
          </p>
        ) : (
          <p className="mt-3 text-xs text-amber-700">
            You can continue now. Completing missing sections later will improve precision.
          </p>
        )}
      </section>

      {/* CTA */}
      <div className="flex justify-end">
        <button
          onClick={() => router.push(`/app/report/overview?rid=${rid}`)}
          className="btn btn-primary"
        >
          Start your report →
        </button>
      </div>
    </div>
  );
}