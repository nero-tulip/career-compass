"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateCareerClusters } from "@/app/lib/results/generators/generate-career-clusters";

function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

export default function CareerClustersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof generateCareerClusters>> | null>(null);

  const reveal = useReveal();

  // Load once
  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await generateCareerClusters(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load career clusters.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  // Derive BEFORE any early return (to keep hook order stable)
  const clusters = data?.clusters ?? [];
  const top3 = useMemo(() => clusters.slice(0, 3), [clusters]);

  if (loading || busy)
    return <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">Loading career clusters…</div>;
  if (error) return <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}>
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Career Cluster Recommendations</h1>
        <p className="text-gray-600">
          Broad fields that align with your interests, personality, and preferences.
        </p>
      </header>

      {/* Top 3 at a glance */}
      <section className="rounded-2xl border p-6 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Top matches</h2>
        <div className="grid sm:grid-cols-3 gap-3">
          {top3.map((c) => (
            <div key={c.key} className="rounded-xl border p-4 bg-[--surface]">
              <div className="font-medium">{c.label}</div>
              <div className="text-xs text-gray-600 mt-1">Score: {c.score}</div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Scores are a simple v1 heuristic. {/* TODO: replace with ONET/LLM-backed scorer */}
        </p>
      </section>

      {/* Full list with rationales and example roles */}
      <section className="space-y-4">
        {clusters.map((c) => (
          <div key={c.key} className="rounded-2xl border p-6 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{c.label}</h3>
                <div className="text-xs text-gray-500">Score: {c.score}</div>
              </div>
            </div>

            <p className="mt-3 text-sm text-gray-800">{c.rationale}</p>

            {c.contributingSignals.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {c.contributingSignals.slice(0, 5).map((s, i) => (
                  <span key={i} className="px-2 py-1 text-xs rounded-full border bg-[--surface] text-gray-700">
                    {s}
                  </span>
                ))}
              </div>
            ) : null}

            <div className="mt-4">
              <div className="text-sm font-medium">Example roles</div>
              <ul className="list-disc pl-5 text-sm text-gray-800 space-y-1 mt-1">
                {c.exampleRoles.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-between">
        <button onClick={() => router.push(`/app/report/decision-making?rid=${rid}`)} className="btn btn-ghost">
          ← Back: Decision & Work Habits
        </button>
        <button onClick={() => router.push(`/app/report/example-roles?rid=${rid}`)} className="btn btn-primary">
          Next: Example Roles →
        </button>
      </div>
    </div>
  );
}