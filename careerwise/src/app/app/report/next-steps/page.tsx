// src/app/app/report/next-steps/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateNextSteps } from "@/app/lib/results/generators/generate-next-steps";
import ReportNav from "@/app/components/ReportNav";

function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs text-gray-700 bg-[--surface]">
      {children}
    </span>
  );
}

export default function NextStepsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof generateNextSteps>> | null>(null);
  const reveal = useReveal();

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await generateNextSteps(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load next steps.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy)
    return <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">Preparing your next steps…</div>;
  if (error) return <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}>
      {/* NAV */}
      <ReportNav rid={rid} />

      {/* HEADER */}
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Next Steps</h1>
        <p className="text-gray-600">
          Small, high-signal actions to turn insight into momentum.
        </p>
      </header>

      <section className="space-y-4">
        {data.steps.map((s, idx) => (
          <div key={idx} className="rounded-2xl border p-6 bg-white shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <Pill>{s.effort === "low" ? "Low Effort" : s.effort === "medium" ? "Medium Effort" : "High Effort"}</Pill>
            </div>
            <p className="text-sm text-gray-700 mt-1">{s.why}</p>

            <ul className="mt-3 list-disc pl-5 text-sm text-gray-800 space-y-1">
              {s.actions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>

            {s.signals?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {s.signals.map((sg, i) => (
                  <Pill key={`${sg.from}-${i}`}>
                    <span className="text-gray-500">{sg.from}</span>&nbsp;{sg.signal}
                  </Pill>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </section>

      {data.note ? (
        <p className="text-xs text-gray-500">{data.note}</p>
      ) : null}

      <div className="flex justify-between">
        <button onClick={() => router.push(`/app/report/example-roles?rid=${rid}`)} className="btn btn-ghost">
          ← Back: Example Roles
        </button>
        <button onClick={() => router.push(`/app`)} className="btn btn-primary">
          Finish & Return to Dashboard
        </button>
      </div>
    </div>
  );
}