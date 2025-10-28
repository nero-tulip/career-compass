"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import ReportNav from "@/app/components/ReportNav";
import type { ValuesReport } from "@/app/lib/results/types";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold">{children}</h2>;
}
function MotivationChip({ text }: { text: string }) {
  return (
    <span className="px-3 py-1 rounded-full text-sm bg-[var(--sky-50)] text-gray-800 ring-1 ring-[var(--sky-200)]">
      {text}
    </span>
  );
}

export default function WorkValuesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [report, setReport] = useState<ValuesReport | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      try {
        setBusy(true);
        setErr(null);
        const token = await user.getIdToken(); // use Firebase Web SDK directly
        const res = await fetch("/api/report/values", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rid }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as ValuesReport;
        setReport(data);
      } catch (e: any) {
        setErr(e?.message ?? "Failed to load work values");
      } finally {
        setBusy(false);
      }
    })();
  }, [loading, user, rid]);

  if (loading || busy) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-sm text-gray-600">Loading…</div>;
  }
  if (err || !report) {
    return <div className="max-w-3xl mx-auto px-4 py-12 text-red-600">{err ?? "No data"}</div>;
  }

  const { title, opening, topMotivations, lowMotivations, summary } = report;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
      <ReportNav rid={rid} />

      {/* 1) Title */}
      <header className="text-center space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">{title}</h1>
      </header>

      {/* 2) Opening paragraph */}
      <section className="space-y-3 text-center">
        <p className="text-[1.05rem] text-gray-800 leading-relaxed max-w-2xl mx-auto">
          {opening}
        </p>
      </section>

      {/* 3) Top 3 motivations */}
      <section className="space-y-4">
        <SectionTitle>What most drives you</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {topMotivations.map((m) => (
            <MotivationChip key={m.name} text={m.name} />
          ))}
        </div>
        <div className="grid gap-4">
          {topMotivations.map((m) => (
            <div key={m.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
              <div className="text-lg font-semibold">
                {m.name}{" "}
                {typeof m.score === "number" ? (
                  <span className="text-sm text-gray-500">· {m.score}%</span>
                ) : null}
              </div>
              <p className="text-gray-700">{m.why}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4) Least important 3 */}
      <section className="space-y-4">
        <SectionTitle>What you care less about</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {lowMotivations.map((m) => (
            <MotivationChip key={m.name} text={m.name} />
          ))}
        </div>
        <div className="grid gap-4">
          {lowMotivations.map((m) => (
            <div key={m.name} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
              <div className="text-lg font-semibold">{m.name}</div>
              <p className="text-gray-700">{m.why}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5) Summary paragraph */}
      <section className="space-y-3">
        <SectionTitle>What this means for you</SectionTitle>
        <p className="text-[1.05rem] text-gray-800 leading-relaxed">{summary}</p>
      </section>

      {/* Pager */}
      <div className="flex justify-between pt-2">
        <button onClick={() => router.push(`/app/report/big5?rid=${rid}`)} className="btn btn-ghost">
          ← Back: Big-5
        </button>
        <button onClick={() => router.push(`/app/report/team-role?rid=${rid}`)} className="btn btn-primary">
          Next: Team Role & Collaboration →
        </button>
      </div>
    </div>
  );
}