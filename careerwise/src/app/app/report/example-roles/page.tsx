"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateExampleRoles } from "@/app/lib/results/generators/generate-example-roles";

function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), 20); return () => clearTimeout(t); }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

export default function ExampleRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof generateExampleRoles>> | null>(null);
  const reveal = useReveal();

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await generateExampleRoles(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load example roles.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy)
    return <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">Loading roles and career paths…</div>;
  if (error) return <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>;
  if (!data) return null;

  return (
    <div className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}>
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Example Roles & Career Paths</h1>
        <p className="text-gray-600">
          Real-world roles aligned to your strongest clusters and personality patterns.
        </p>
      </header>

      {data.topClusters.map((c) => (
        <section key={c.clusterKey} className="rounded-2xl border p-6 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold">{c.clusterLabel}</h2>
              <p className="text-sm text-gray-600 mt-1">{c.rationale}</p>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {c.roles.map((r, i) => (
              <li
                key={i}
                className="rounded-xl border p-4 bg-[--surface] hover:bg-gray-50 transition-all"
              >
                <div className="flex justify-between items-center">
                  <div className="font-medium">{r.title}</div>
                  <span className="text-xs text-gray-500 uppercase">{r.level}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{r.summary}</p>
              </li>
            ))}
          </ul>
        </section>
      ))}

      <div className="flex justify-between">
        <button onClick={() => router.push(`/app/report/career-clusters?rid=${rid}`)} className="btn btn-ghost">
          ← Back: Career Clusters
        </button>
        <button onClick={() => router.push(`/app/report/next-steps?rid=${rid}`)} className="btn btn-primary">
          Next: Next Steps →
        </button>
      </div>
    </div>
  );
}