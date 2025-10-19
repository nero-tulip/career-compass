"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateSkillSummary } from "@/app/lib/results/generators/generate-skills";

export default function SkillPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof generateSkillSummary>> | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await generateSkillSummary(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load skills summary.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy) return <div className="py-12 text-center text-gray-600">Loading your skill summary…</div>;
  if (error) return <div className="py-12 text-center text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Skill Strengths & Growth Areas</h1>
        <p className="text-gray-600">How your personality and preferences translate into professional capabilities.</p>
      </header>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Your Strengths</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-800">
            {data.strengths.map((s) => (
              <li key={s.label}>
                <strong>{s.label}:</strong> {s.rationale}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Growth Opportunities</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-800">
            {data.growthAreas.map((s) => (
              <li key={s.label}>
                <strong>{s.label}:</strong> {s.rationale}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex justify-between">
        <button onClick={() => router.push(`/app/report/environment?rid=${rid}`)} className="btn btn-ghost">
          ← Back: Work Environment
        </button>
        <button onClick={() => router.push(`/app/report/decision-making?rid=${rid}`)} className="btn btn-primary">
          Next: Decision-Making →
        </button>
      </div>
    </div>
  );
}