// src/app/app/report/overview/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadIntakeSummary } from "@/app/lib/results/loaders";
import type { IntakeSummary } from "@/app/lib/results/types";
import { generateOverviewIntro } from "@/app/lib/results/generators/generate-overview-intro";

/** Tiny fade-in helper */
function useReveal(delay = 20) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

/** Gradient hero with animated intro lines */
function IntroHero({ intake, rid }: { intake: IntakeSummary; rid: string }) {
  const cls = useReveal(40);
  const intro = useMemo(() => generateOverviewIntro(intake), [intake]);

  const lines = useMemo(
    () => intro.text.split("\n").filter((l) => l.trim().length > 0),
    [intro.text]
  );

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border shadow-sm transition-all ${cls}`}
      style={{
        background:
          "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(168,85,247,0.08))",
      }}
    >
      {/* soft corner glow */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl opacity-40"
        style={{ background: "radial-gradient(circle, #a855f7 0%, transparent 70%)" }}
      />

      <div className="relative p-6 sm:p-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium bg-white/80 backdrop-blur">
            <span>CareerCompass Report</span>
            <span className="h-1 w-1 rounded-full bg-gray-400" />
            <span className="text-gray-600">Overview</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
            Nice to meet you 👋
          </h1>

          <div className="mt-4 space-y-2">
            {lines.map((line, i) => (
              <p
                key={i}
                className="text-gray-800 leading-relaxed opacity-0 translate-y-2 transition-all"
                style={{
                  transitionDuration: "500ms",
                  transitionDelay: `${120 + i * 90}ms`,
                  opacity: 1,
                  transform: "translateY(0)",
                }}
              >
                {line}
              </p>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href={`/app/quiz/intake?rid=${encodeURIComponent(rid)}`}
              className="px-3 py-1.5 rounded-lg text-sm ring-1 ring-gray-200 text-gray-700 hover:bg-white/70 backdrop-blur"
            >
              Edit details
            </a>
            <a
              href={`/app/report/riasec?rid=${encodeURIComponent(rid)}`}
              className="px-3 py-1.5 rounded-lg text-sm text-white"
              style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)" }}
            >
              Looks right →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function OverviewResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [intake, setIntake] = useState<IntakeSummary | undefined>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const i = await loadIntakeSummary(user, rid);
        setIntake(i);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load your data");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Loading your results…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="rounded-xl border p-4 bg-red-50 text-red-700">{error}</div>
      </div>
    );
  }

  if (!user) {
    router.replace("/login?next=/app/report/overview");
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      {intake ? <IntroHero intake={intake} rid={rid} /> : null}

      {/* Fallback if intake is missing */}
      {!intake ? (
        <div className="rounded-2xl border p-6 bg-white shadow-sm text-center">
          <p className="text-gray-800">
            We don’t have your intro details yet. Start with the intake and come back!
          </p>
          <a
            className="inline-block mt-4 px-3 py-1.5 rounded-lg text-sm text-white"
            style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)" }}
            href={`/app/quiz/intake?rid=${encodeURIComponent(rid)}`}
          >
            Complete intake →
          </a>
        </div>
      ) : null}

      {/* Next button (mirrors “Looks right →” for clarity) */}
      <div className="text-center">
        <button
          onClick={() => router.push(`/app/report/riasec?rid=${encodeURIComponent(rid)}`)}
          className="btn btn-primary"
          style={{ background: "linear-gradient(90deg,#22d3ee,#a855f7)", border: "none" }}
        >
          Next: RIASEC Profile →
        </button>
      </div>
    </div>
  );
}