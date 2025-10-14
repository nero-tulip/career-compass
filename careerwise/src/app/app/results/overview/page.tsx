"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import {
  loadIntakeSummary,
  loadMacroSummary,
} from "@/app/lib/results/loaders";
import type { IntakeSummary, MacroSummary } from "@/app/lib/results/types";

/** Simple fade-in animation helper */
function useReveal(delay = 20) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible
    ? "opacity-100 translate-y-0"
    : "opacity-0 translate-y-3";
}

/** Small card component for sections */
function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const cls = useReveal();
  return (
    <div
      className={`rounded-2xl border p-6 bg-white shadow-sm transition-all duration-300 ${cls}`}
    >
      <h2 className="text-xl font-semibold mb-3">{title}</h2>
      <div className="space-y-4 text-gray-800">{children}</div>
    </div>
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
          loadMacroSummary(user, rid),
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
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Loading your results...
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="rounded-xl border p-4 bg-red-50 text-red-700">
          {error}
        </div>
      </div>
    );

  if (!user) {
    router.replace("/login?next=/app/results/overview");
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Your CareerCompass Overview
        </h1>
        <p className="text-gray-600">
          A personalized summary of who you are, what you value, and what
          you’re looking for.
        </p>
      </header>

      {/* Intake Summary */}
      {intake && (
        <SectionCard title="About You">
          <ul className="text-sm space-y-2">
            {intake.name && (
              <li>
                <strong>Name:</strong> {intake.name}
              </li>
            )}
            {intake.country?.label && (
              <li>
                <strong>Country:</strong> {intake.country.label}
              </li>
            )}
            {intake.educationLevel?.label && (
              <li>
                <strong>Education:</strong> {intake.educationLevel.label}
              </li>
            )}
            {intake.status?.length && (
              <li>
                <strong>Status:</strong>{" "}
                {intake.status.map((s) => s.label).join(", ")}
              </li>
            )}
            {intake.stageOfCareer?.label && (
              <li>
                <strong>Stage of career:</strong>{" "}
                {intake.stageOfCareer.label}
              </li>
            )}
            {intake.goals?.length && (
              <li>
                <strong>Goals:</strong>{" "}
                {intake.goals.map((g) => g.label).join(", ")}
              </li>
            )}
          </ul>
        </SectionCard>
      )}

      {/* Macro Summary */}
      {macro && (
        <SectionCard title="Career Preferences">
          <p className="text-sm text-gray-600 mb-3">
            These reflect how you approach work, priorities, and motivation.
          </p>

          {Object.keys(macro.likert).length > 0 && (
            <div className="space-y-2">
              {Object.values(macro.likert).map((q) => (
                <div key={q.id}>
                  <div className="flex justify-between text-sm">
                    <span>{q.prompt}</span>
                    <span className="font-medium">{q.choiceLabel}</span>
                  </div>
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      style={{ width: `${(q.score / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {Object.keys(macro.selects).length > 0 && (
            <div className="mt-4 text-sm space-y-2">
              {Object.values(macro.selects).map((s) => (
                <div key={s.id}>
                  <strong>{s.prompt}:</strong> {s.label}
                </div>
              ))}
            </div>
          )}

          {Object.keys(macro.chips).length > 0 && (
            <div className="mt-4 text-sm space-y-2">
              {Object.values(macro.chips).map((c) => (
                <div key={c.id}>
                  <strong>{c.prompt}:</strong> {c.labels.join(", ")}
                </div>
              ))}
            </div>
          )}

          {Object.keys(macro.textareas).length > 0 && (
            <div className="mt-4 text-sm space-y-3">
              {Object.values(macro.textareas).map((t) => (
                <div key={t.id}>
                  <strong>{t.prompt}</strong>
                  <p className="mt-1 text-gray-700 whitespace-pre-line">
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Navigation */}
      <div className="text-center">
        <button
          onClick={() => router.push(`/app/results/riasec?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: RIASEC Profile →
        </button>
      </div>
    </div>
  );
}