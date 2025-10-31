"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadIntakeSummary, loadMacroSummary } from "@/app/lib/results/loaders";
import type { IntakeSummary, MacroSummary } from "@/app/lib/results/types";
import {
  generateOverviewIntro,
  type IntroSegment,
  type HighlightTag,
} from "@/app/lib/results/generators/generate-overview-intro";

/** Pastel background highlight mapping */
const HI_STYLE: Record<HighlightTag, string> = {
  // intake
  name: "highlight-mint",
  age: "highlight-sand",
  country: "highlight-sky",
  education: "highlight-lav",
  status: "highlight-blush",
  stage: "highlight-mint",
  goal: "highlight-sky",

  // granular macro (multi-color!)
  macroIndustry: "highlight-sky",
  macroEnv: "highlight-mint",
  macroLeadership: "highlight-blush",
  macroIncome: "highlight-sand",
  macroImpact: "highlight-lav",
  macroFlex: "highlight-sky",
  macroSecurity: "highlight-sand",
  macroTravel: "highlight-mint",
  macroLocation: "highlight-lav",
};

/** Fade & slide animation when in view */
function FadeLine({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 250 + index * 300);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <p
      className={`transition-all duration-700 ease-out text-center text-[1.25rem] md:text-[1.35rem] leading-relaxed font-medium ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </p>
  );
}

export default function OverviewResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [intake, setIntake] = useState<IntakeSummary | undefined>();
  const [macro, setMacro] = useState<MacroSummary | undefined>();
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const [i, m] = await Promise.all([
          loadIntakeSummary(user, rid),
          loadMacroSummary(user, rid).catch(() => undefined), // ok if not finished yet
        ]);
        setIntake(i);
        setMacro(m);
      } catch (err: any) {
        setError(err?.message ?? "Failed to load your data");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy)
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center text-gray-600 text-lg">
        Loading your results...
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center text-red-700">
        {error}
      </div>
    );

  if (!user) {
    router.replace("/login?next=/app/report/overview");
    return null;
  }

  const intro = intake ? generateOverviewIntro(intake, macro) : null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-14">
      <header className="text-center space-y-2">
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900">
          Nice to meet you 👋
        </h1>
        <p className="text-gray-600 text-lg">
          We’ve been paying attention. Here’s what we know so far.
        </p>
      </header>

      {/* Sentence-by-sentence reveal with pastel highlights */}
      {intro ? (
        <div className="flex flex-col items-center space-y-5">
          {intro.lines.map((segments, i) => (
            <FadeLine key={i} index={i}>
              {segments.map((s: IntroSegment, j: number) =>
                s.hi ? (
                  <span
                    key={j}
                    className={`${
                      HI_STYLE[s.hi]
                    } rounded-lg px-1.5 py-0.5 transition-colors duration-300`}
                  >
                    {s.text}
                  </span>
                ) : (
                  <span key={j}>{s.text}</span>
                )
              )}
            </FadeLine>
          ))}
        </div>
      ) : null}

      {/* Navigation */}
      <div className="pt-2 flex justify-center gap-4">
          <button
            onClick={() =>
              router.push(`/app/quiz/intake?rid=${encodeURIComponent(rid)}`)
            }
            className="btn btn-ghost text-lg font-semibold"
          >
            No, I need to edit something
          </button>
        <button
          onClick={() =>
            router.push(`/app/report/riasec?rid=${encodeURIComponent(rid)}`)
          }
          className="btn btn-primary"
        >
          Sounds great!
        </button>

      </div>
    </div>
  );
}
