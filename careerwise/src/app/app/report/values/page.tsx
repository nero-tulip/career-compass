"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import ReportNav from "@/app/components/ReportNav";
import type { ValuesReport } from "@/app/lib/results/types";

// --- Components ---

/** * Simple wrapper for scroll-triggered fade animations. 
 * Adds a small delay based on index for staggered effects.
 */
function FadeIn({ 
  children, 
  delayIndex = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delayIndex?: number; 
  className?: string; 
}) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const delay = delayIndex * 100; // 100ms stagger

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-semibold text-gray-900">{children}</h2>;
}

function MotivationCard({ 
  name, 
  score, 
  why, 
  rank 
}: { 
  name: string; 
  score?: number; 
  why: string; 
  rank: number; // 0, 1, 2
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-sky-200">
      {/* Decorative rank number */}
      <div className="absolute -right-4 -top-6 text-[5rem] font-bold text-gray-50 opacity-50 select-none group-hover:text-sky-50 transition-colors">
        {rank + 1}
      </div>

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900">{name}</h3>
          {score !== undefined && (
            <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-600/20">
              {score}% Match
            </span>
          )}
        </div>

        {/* Progress Bar Visual */}
        {score !== undefined && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full bg-sky-500 transition-all duration-1000 ease-out"
              style={{ width: `${score}%` }}
            />
          </div>
        )}

        <div className="pt-1">
          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">
            Why this fits you
          </p>
          <p className="text-[0.95rem] leading-relaxed text-gray-700">
            {why}
          </p>
        </div>
      </div>
    </div>
  );
}

function LowMotivationRow({ name, why }: { name: string; why: string }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:items-baseline rounded-xl border border-dashed border-gray-300 bg-gray-50/50 p-4 transition-colors hover:bg-white hover:border-gray-300">
      <div className="shrink-0 min-w-[140px]">
        <span className="font-semibold text-gray-600">{name}</span>
      </div>
      <p className="text-sm text-gray-500 leading-relaxed">{why}</p>
    </div>
  );
}

// --- Main Page ---

export default function WorkValuesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ValuesReport | null>(null);

  useEffect(() => {
    if (loading || !user) return;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        const token = await user.getIdToken();
        const res = await fetch("/api/report/values", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ rid }),
        });
        
        if (!res.ok) throw new Error("Could not load report.");
        const data = await res.json();
        setReport(data);
      } catch (e: any) {
        setError(e.message ?? "Failed to load.");
      } finally {
        setBusy(false);
      }
    })();
  }, [loading, user, rid]);

  if (loading || busy) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-500 text-sm">Analyzing your work values...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <div className="text-red-600 mb-2">Error loading report</div>
        <p className="text-gray-600 text-sm">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 btn btn-secondary"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { title, opening, topMotivations, lowMotivations, summary } = report;

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-16">
      <ReportNav rid={rid} />

      {/* Header Section */}
      <FadeIn className="text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
          {title}
        </h1>
        <p className="text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
          {opening}
        </p>
      </FadeIn>

      {/* Top Motivations (The "Meat") */}
      <section className="space-y-8">
        <FadeIn>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-sky-500 rounded-full"></div>
            <SectionTitle>Your Core Drivers</SectionTitle>
          </div>
          <p className="text-gray-600 max-w-2xl">
            These are the deal-breakers. When these needs are met, you feel energized and engaged.
          </p>
        </FadeIn>

        <div className="grid gap-6">
          {topMotivations.map((m, idx) => (
            <FadeIn key={m.name} delayIndex={idx}>
              <MotivationCard 
                name={m.name} 
                score={m.score} 
                why={m.why} 
                rank={idx}
              />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Low Motivations */}
      <section className="space-y-6">
        <FadeIn delayIndex={1}>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-1 bg-gray-300 rounded-full"></div>
            <SectionTitle>Less Important to You</SectionTitle>
          </div>
          <p className="text-gray-600 max-w-2xl">
            These factors matter less to your satisfaction. You might be willing to trade them off for better opportunities elsewhere.
          </p>
        </FadeIn>
        
        <div className="space-y-3">
          {lowMotivations.map((m, idx) => (
            <FadeIn key={m.name} delayIndex={idx + 2}>
              <LowMotivationRow name={m.name} why={m.why} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Summary Box */}
      <FadeIn delayIndex={3}>
        <div className="rounded-2xl bg-[--surface] p-8 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Your Personal Values Statement
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {summary}
          </p>
        </div>
      </FadeIn>

      {/* Navigation Footer */}
      <FadeIn delayIndex={4} className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4 items-center border-t border-gray-100">
        <button 
          onClick={() => router.push(`/app/report/riasec?rid=${rid}`)} 
          className="text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back to Interests
        </button>
        <button 
          onClick={() => router.push(`/app/report/environment?rid=${rid}`)} 
          className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-sky-200"
        >
          Next: Ideal Environment →
        </button>
      </FadeIn>
    </div>
  );
}