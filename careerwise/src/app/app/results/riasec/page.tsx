// src/app/app/results/riasec/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

type RIASEC = { R: number; I: number; A: number; S: number; E: number; C: number };
type RiaResult = { profile: RIASEC; top3?: string[]; computedAt: string };

function Bar({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / 5) * 100)));
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold" : ""}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            highlight ? "bg-gradient-to-r from-cyan-400 to-violet-500" : "bg-gray-800"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function RiasecResultPage() {
  const sp = useSearchParams();
  const rid = sp.get("rid") || "";
  const { user, loading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<RiaResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Always define a safe profile so hooks below can compute every render
  const safeProfile: RIASEC =
    result?.profile ?? { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

  // ⚠️ Hook must be unconditional: compute top3 even while loading (it'll just use safeProfile)
  const top3 = useMemo(() => {
    const entries = Object.entries(safeProfile) as Array<[keyof RIASEC, number]>;
    return entries.sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k as string);
  }, [safeProfile]);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (loading) return;
      if (!user) {
        router.replace("/login?next=/app/results/riasec");
        return;
      }
      try {
        setBusy(true);
        setErr(null);
        if (!rid) throw new Error("Missing result id (rid).");
        const token = await user.getIdToken();
        const res = await fetch(
          `/api/results/section?rid=${encodeURIComponent(rid)}&section=riasec`,
          { headers: { Authorization: "Bearer " + token } }
        );
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        if (!alive) return;
        setResult(data.result as RiaResult);
      } catch (e: any) {
        if (!alive) return;
        setErr(e?.message || "Failed to load RIASEC results.");
      } finally {
        if (!alive) return;
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, loading, rid, router]);

  // Render states
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-sm text-gray-600">Loading…</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-red-600 font-medium mb-2">We couldn’t load your RIASEC result</div>
          <div className="text-sm text-gray-600 mb-4">{err}</div>
          <a href="/app" className="btn btn-primary">Back to dashboard</a>
        </div>
      </div>
    );
  }

  if (!result) {
    // Shouldn’t happen, but keep a safe guard.
    return null;
  }

  const p = safeProfile;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Your RIASEC profile</h1>
      <p className="text-sm text-gray-600">
        Computed on {new Date(result.computedAt).toLocaleString()}
      </p>

      <div className="grid gap-3">
        <Bar label="Realistic (R)" value={p.R} highlight={top3.includes("R")} />
        <Bar label="Investigative (I)" value={p.I} highlight={top3.includes("I")} />
        <Bar label="Artistic (A)" value={p.A} highlight={top3.includes("A")} />
        <Bar label="Social (S)" value={p.S} highlight={top3.includes("S")} />
        <Bar label="Enterprising (E)" value={p.E} highlight={top3.includes("E")} />
        <Bar label="Conventional (C)" value={p.C} highlight={top3.includes("C")} />
      </div>

      <div className="rounded-xl border p-4 bg-white">
        <div className="font-medium mb-2">Top three</div>
        <div className="flex gap-2 flex-wrap">
          {top3.map((k) => (
            <span key={k} className="px-2 py-1 rounded-full bg-black text-white text-xs">
              {k}
            </span>
          ))}
        </div>
      </div>

      <div className="flex justify-between">
        <a href="/app" className="btn btn-ghost">Back to dashboard</a>
        <a href={`/app/results?rid=${encodeURIComponent(rid)}`} className="btn btn-primary">
          See full report
        </a>
      </div>
    </div>
  );
}