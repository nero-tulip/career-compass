// src/app/app/report/big5/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { loadBig5Summary } from "@/app/lib/results/loaders/map-big5";
import type { Big5Summary, Big5Key } from "@/app/lib/results/loaders/map-big5";
import {
  generateBig5Section,
  type Big5Section,
} from "@/app/lib/results/generators/generate-big5-section";

/** Quick fade-in for initial page reveal */
function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), 20);
    return () => clearTimeout(t);
  }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

/** Horizontal bar (for 1–5 scale) */
function TraitBar({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number; // 1..5
  highlight?: boolean;
}) {
  const pct = Math.min(100, (value / 5) * 100); // fixed 1–5 scale
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className={highlight ? "font-semibold" : ""}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${
            highlight
              ? "bg-gradient-to-r from-cyan-400 to-violet-500"
              : "bg-gray-700"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** Sequential fade/slide animation like Overview */
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
    >
      {children}
    </div>
  );
}

export default function Big5ResultsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Big5Summary | null>(null);

  const reveal = useReveal();

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await loadBig5Summary(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load Big-5 results");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  // ---- hooks above any early returns ----
  const scores = data?.scores ?? [];
  const topKeys = data?.top3 ?? ([] as Big5Key[]);

  // Always run useMemo — safe because generateBig5Section handles undefined gracefully
  const section: Big5Section | null = useMemo(() => {
    if (!data) return null;
    return generateBig5Section(data);
  }, [data]);

  // ---- safe early returns ----
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Loading your Big-5 profile…
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>
    );
  }
  if (!data || !section) return null;

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-16 space-y-12 transition-all ${reveal}`}
    >
      {/* HEADER */}
      <div className="flex flex-col items-center space-y-6 text-center">
        <FadeBlock index={0}>
          <h1 className="text-4xl font-semibold text-gray-900">
            Let’s take a closer look at your personality
          </h1>
        </FadeBlock>
        <FadeBlock index={1}>
          <p className="text-[1.3rem] text-gray-700">
            Your{" "}
            <span className="text-gradient font-semibold">Big-5 Profile</span>{" "}
            reveals the deeper tendencies shaping how you think, feel, and work.
          </p>
        </FadeBlock>
      </div>

      {/* INTRO */}
      <FadeBlock index={2}>
        <p className="text-gray-700 text-[1.15rem] leading-relaxed text-center max-w-2xl mx-auto">
          {section.intro}
        </p>
      </FadeBlock>

      {/* TRAITS */}
      <section className="space-y-10">
        {section.traits.map((t, i) => (
          <FadeBlock key={t.key} index={i + 3}>
            <div className="space-y-3 border-b border-gray-200 pb-8 last:border-none">
              <h3 className="text-xl font-semibold text-gray-900">
                {t.header}
              </h3>
              <TraitBar
                label={t.header}
                value={t.score}
                highlight={topKeys.includes(t.key)}
              />
              <p className="text-gray-700 text-[1.05rem] leading-relaxed">
                {t.paragraph}
              </p>
            </div>
          </FadeBlock>
        ))}
      </section>

      {/* COMBINED INSIGHT */}
      <FadeBlock index={10}>
        <section className="space-y-4 text-center">
          <h2 className="text-2xl font-semibold text-gray-900">
            What it all means
          </h2>
          <p className="text-gray-700 text-[1.1rem] leading-relaxed max-w-2xl mx-auto">
            {section.combinedInsight}
          </p>
        </section>
      </FadeBlock>

      {/* NEXT BUTTON */}
      <FadeBlock index={11}>
        <div className="text-center pt-10">
          <button
            onClick={() => router.push(`/app/report/values?rid=${rid}`)}
            className="btn btn-primary text-lg font-semibold"
            style={{
              background:
                "linear-gradient(90deg,var(--mint-400),var(--sky-400))",
              border: "none",
              boxShadow: "0 3px 8px rgba(0,0,0,0.06)",
            }}
          >
            Next: Work Values →
          </button>
        </div>
      </FadeBlock>
    </div>
  );
}
