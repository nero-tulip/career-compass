"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateWorkMotivations } from "@/app/lib/results/generators/generate-work-motivations";
import type { Motivator } from "@/app/lib/results/types";

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}

export default function WorkValuesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [motivs, setMotivs] = useState<Motivator[]>([]);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        setErr(null);
        const res = await generateWorkMotivations(user, rid);
        setMotivs(res);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load values");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy)
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-600">
        Loading your work values…
      </div>
    );

  if (err)
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-red-600">{err}</div>
    );

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Work Values & Motivations</h1>
        <p className="text-gray-600">
          The deeper drives that make a job feel meaningful to you.
        </p>
      </header>

      <section className="space-y-4">
        {motivs.map((m) => (
          <div key={m.key} className="rounded-2xl border p-6 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{m.label}</h2>
              <Badge>{m.confidence === "high" ? "High confidence" : m.confidence === "medium" ? "Likely" : "Tentative"}</Badge>
            </div>
            <p className="mt-2 text-gray-800">{m.rationale}</p>

            <div className="mt-3 text-xs text-gray-500">
              Signals:{" "}
              {m.sources.map((s, i) => (
                <span key={`${s.from}-${i}`} className="inline-block mr-2">
                  <code className="bg-gray-100 rounded px-1 py-0.5">{s.from}</code> {s.signal}
                </span>
              ))}
            </div>
          </div>
        ))}
      </section>

      <div className="flex justify-between pt-2">
        <button
          onClick={() => router.push(`/app/report/big5?rid=${rid}`)}
          className="btn btn-ghost"
        >
          ← Back: Big-5
        </button>
        <button
          onClick={() => router.push(`/app/report/team?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: Team Role & Collaboration →
        </button>
      </div>
    </div>
  );
}