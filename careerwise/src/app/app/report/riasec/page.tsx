// src/app/app/report/riasec/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadRiasecSummary } from "@/app/lib/results/loaders/map-riasec";
import type {
  RIASECSummary,
  RIASECKey,
} from "@/app/lib/results/loaders/map-riasec";
import {
  generateRiasecSection,
  type RiasecSection,
} from "@/app/lib/results/generators/generate-riasec-section";
import { loadIntakeSummary } from "@/app/lib/results/loaders";
import type { IntakeSummary } from "@/app/lib/results/types";

/* -------------------- Core labels & colors -------------------- */
const LABELS: Record<RIASECKey, string> = {
  R: "Realistic",
  I: "Investigative",
  A: "Artistic",
  S: "Social",
  E: "Enterprising",
  C: "Conventional",
};

const TRAIT_COLORS: Record<RIASECKey, string> = {
  R: "bg-amber-500",
  I: "bg-sky-500",
  A: "bg-violet-500",
  S: "bg-emerald-500",
  E: "bg-rose-500",
  C: "bg-indigo-500",
};

/* -------------------- Animations -------------------- */
function useReveal() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 30);
    return () => clearTimeout(t);
  }, []);
  return shown ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

/* -------------------- Trait Bar -------------------- */
function TraitBar({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number; // 1–5
  color: string;
  highlight?: boolean;
}) {
  const pct = Math.min(100, (value / 5) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold" : ""}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${
            highlight ? "bg-gradient-to-r from-cyan-400 to-violet-500" : color
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Sequential fade/slide animation like Overview but for full blocks */
function FadeBlock({
  children,
  index,
  delayPerItem = 200,
}: {
  children: React.ReactNode;
  index: number;
  delayPerItem?: number;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 250 + index * delayPerItem);
    return () => clearTimeout(t);
  }, [index, delayPerItem]);

  return (
    <div
      className={`transition-all duration-700 ease-out text-[1.05rem] leading-relaxed ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {children}
    </div>
  );
}

/* -------------------- Page -------------------- */
export default function RiasecReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RIASECSummary | null>(null);
  const reveal = useReveal();
  const [intake, setIntake] = useState<IntakeSummary | null>(null);

  useEffect(() => {
  if (!user || loading) return;
  (async () => {
    try {
      setBusy(true);
      // Load both RIASEC and Intake in parallel
      const [riasec, intakeSum] = await Promise.all([
        loadRiasecSummary(user, rid),
        loadIntakeSummary(user, rid),
      ]);
      setData(riasec);
      setIntake(intakeSum ?? null);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load RIASEC results");
    } finally {
      setBusy(false);
    }
  })();
}, [user, rid, loading]);

  const section: RiasecSection | null = useMemo(
    () => (data ? generateRiasecSection(data, `${user!.uid}|${rid}`) : null),
    [data, user, rid]
  );

  const scores = data?.scores ?? [];
  const topKeys = data?.top3 ?? ([] as RIASECKey[]);

  /* -------------------- UI states -------------------- */
  if (loading || busy)
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center text-gray-600 text-lg">
        Loading your RIASEC profile…
      </div>
    );

  if (error)
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center text-red-700">
        {error}
      </div>
    );

  if (!data || !section) return null;

  /* -------------------- Render -------------------- */
  return (
    <div
      className={`max-w-3xl mx-auto py-16 px-4 space-y-12 ${reveal}`}
    >
   {/* INTRO HEADER */}
    <div className="flex flex-col items-center space-y-6 text-center">
      <FadeBlock index={0}>
        <h1 className="text-4xl font-semibold text-gray-900">
          So, {(intake?.name) || "".trim()}...
        </h1>
      </FadeBlock>
      <FadeBlock index={1}>
        <p className="text-[1.35rem] md:text-[1.25rem] leading-relaxed text-gray-700">
          Now it’s time to dive a little deeper into your{" "}
          <span className="text-gradient font-semibold">RIASEC Profile</span>.
        </p>
      </FadeBlock>
    </div>

    {/* INTRO PARAGRAPHS */}
    <div className="flex flex-col items-center space-y-5">
      <FadeBlock index={2}>
        <p className="text-gray-700 text-[1.15rem] leading-relaxed max-w-3xl text-center">
          Just a quick refresher — your RIASEC profile explores six key
          dimensions of career interests:
          <strong> Realistic, Investigative, Artistic, Social, Enterprising, </strong>
          and <strong>Conventional</strong>.
        </p>
      </FadeBlock>
      <FadeBlock index={3}>
        <p className="text-gray-700 text-[1.15rem] leading-relaxed max-w-3xl text-center">
          Think of it as a snapshot of your natural work style — what energizes
          you, what environments you thrive in, and how you like to bring ideas
          to life.
        </p>
      </FadeBlock>
    </div>

      {/* 2) Trait breakdowns */}
      <section className="space-y-10">
        {section.traits.map((t, i) => (
        <FadeBlock key={t.key} index={i + 4}>
          <div
            key={t.key}
            className="space-y-3 border-b border-gray-200 pb-8 last:border-none"
          >
            <h3 className="text-xl font-semibold text-gray-900">{t.header}</h3>

            <div className="max-w-3xl">
              <TraitBar
                label={LABELS[t.key]}
                value={t.score}
                color={TRAIT_COLORS[t.key]}
                highlight={topKeys.includes(t.key)}
              />
            </div>

            <p className="text-gray-700 text-[1.05rem] leading-relaxed">
              {t.paragraph}
            </p>
          </div>
        </FadeBlock>
      ))}
    </section>

      {/* 3) Combined insight */}
      <FadeBlock index={12}>
      <section className="space-y-4 pt-4 text-justify">
        <h2 className="text-2xl font-semibold text-gray-900">
          Putting it all together
        </h2>
        <p className="text-gray-700 text-[1.1rem] leading-relaxed max-w-2xl text-justify">
          {section.combinedInsight}
        </p>
      </section>
      </FadeBlock>

      {/* 4) Environments & activities */}
      <FadeBlock index={13}>
      <section className="space-y-4 text-justify">
        <h2 className="text-2xl font-semibold text-gray-900">
          Where you'll thrive
        </h2>
        <p className="text-gray-700 text-[1.05rem] leading-relaxed max-w-2xl text-justify">
          {section.environments.paragraph}
        </p>

        <ul className="max-w-md text-gray-700 list-disc list-inside space-y-2 text-justify">
          {section.environments.examples.map((ex, i) => (
            <li key={i}>{ex}</li>
          ))}
        </ul>
      </section>
      </FadeBlock>

      {/* Nav */}
      <div className="text-center pt-10">
        <button
          onClick={() => router.push(`/app/report/overview?rid=${rid}`)}
          className="btn btn-primary text-lg font-semibold"
          style={{
            background: "linear-gradient(90deg,var(--sky-400),var(--mint-400))",
            border: "none",
            boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
          }}
        >
          ← Back: Overview
        </button>
        {" "}{" "}
        <button
          onClick={() => router.push(`/app/report/big5?rid=${rid}`)}
          className="btn btn-primary text-lg font-semibold"
          style={{
            background: "linear-gradient(90deg,var(--mint-400),var(--sky-400))",
            border: "none",
            boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
          }}
        >
          Next: Big-5 Personality →
        </button>
      </div>
    </div>
  );
}
