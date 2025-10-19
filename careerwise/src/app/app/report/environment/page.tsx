// src/app/app/report/environment/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateEnvironmentSummary } from "@/app/lib/results/generators/generate-environment";

export default function EnvironmentPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof generateEnvironmentSummary>> | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await generateEnvironmentSummary(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load environment summary.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy) return <div className="py-12 text-center text-gray-600">Loading your environment profile…</div>;
  if (error) return <div className="py-12 text-center text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Your Ideal Work Environment</h1>
        <p className="text-gray-600">Where your personality, preferences, and motivations come together.</p>
      </header>

      <section className="rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-gray-800 leading-relaxed">{data.paragraph}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {data.tags.map((t) => (
            <span key={t} className="px-2 py-1 text-sm border rounded-full bg-[--surface] text-gray-700">
              {t}
            </span>
          ))}
        </div>
      </section>

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Best environments for you</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-800">
            {data.bestFits.map((b) => (
              <li key={b.label}><strong>{b.label}:</strong> {b.rationale}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border p-6 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Environments to avoid</h2>
          <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-800">
            {data.avoidFits.map((b) => (
              <li key={b.label}><strong>{b.label}:</strong> {b.rationale}</li>
            ))}
          </ul>
        </div>
      </section>

      <div className="flex justify-between">
        <button
          onClick={() => router.push(`/app/report/team-role?rid=${rid}`)}
          className="btn btn-ghost"
        >
          ← Back: Team Role
        </button>
        <button
          onClick={() => router.push(`/app/report/skills?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: Skill Strengths →
        </button>
      </div>
    </div>
  );
}