"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateCareerClusters } from "@/app/lib/results/generators/generate-career-clusters";
import ReportNav from "@/app/components/ReportNav";

/* The Career Clusters page orients users to the worlds of work that fit their psychology.
   It explains why, surfaces tradeoffs, and stops short of prescribing specific jobs.
*/

// --- Components ---

function FadeIn({
  children,
  delayIndex = 0,
  className = "",
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

  const delay = delayIndex * 150;

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

type ClusterItem = Awaited<ReturnType<typeof generateCareerClusters>>["clusters"][number];

function MatchBadge({ level }: { level: ClusterItem["matchLevel"] }) {
  const styles: Record<ClusterItem["matchLevel"], string> = {
    "Strong Fit": "bg-emerald-100 text-emerald-800 border-emerald-200",
    "Viable with Tradeoffs": "bg-sky-100 text-sky-800 border-sky-200",
    "High Risk": "bg-amber-100 text-amber-800 border-amber-200",
    "Low Fit": "bg-gray-100 text-gray-600 border-gray-200",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level}
    </span>
  );
}

function SustainabilityBadge({ level }: { level: ClusterItem["sustainability"]["level"] }) {
  const styles: Record<ClusterItem["sustainability"]["level"], string> = {
    safe: "bg-emerald-50 text-emerald-700 border-emerald-100",
    risky: "bg-amber-50 text-amber-700 border-amber-100",
    unsustainable: "bg-rose-50 text-rose-700 border-rose-100",
  };

  const label: Record<ClusterItem["sustainability"]["level"], string> = {
    safe: "Sustainable",
    risky: "Some Friction",
    unsustainable: "High Burnout Risk",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {label[level]}
    </span>
  );
}

function ClusterCard({ cluster, index }: { cluster: ClusterItem; index: number }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border bg-white border-gray-200 shadow-sm hover:shadow-md transition-all">
      {/* Decorative Index Number */}
      <div className="absolute -right-4 -top-6 text-[6rem] font-bold text-gray-50 opacity-60 select-none pointer-events-none group-hover:text-sky-50 transition-colors">
        {index + 1}
      </div>

      <div className="p-6 sm:p-8 space-y-6 relative z-10">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <MatchBadge level={cluster.matchLevel} />
            <span className="text-sm font-bold text-sky-600 bg-sky-50 px-2 py-1 rounded-md">
              Fit Index: {cluster.score}
            </span>
          </div>

          <h3 className="text-2xl font-bold text-gray-900">{cluster.label}</h3>

          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            {cluster.description}
          </p>
        </div>

        {/* Summary (user-facing why + caveats) */}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 space-y-2">
          <div className="text-sm font-semibold text-gray-800">{cluster.summary.headline}</div>
          <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
            {cluster.summary.bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>

        {/* STEP 2: Sustainability / Temperament (Big Five) */}
        <div className="rounded-xl bg-white border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Sustainability & Temperament
            </h4>
            <SustainabilityBadge level={cluster.sustainability.level} />
          </div>

          {cluster.sustainability.supports.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-700">Supports</div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                {cluster.sustainability.supports.slice(0, 3).map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}

          {cluster.sustainability.risks.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-semibold text-amber-700">Risks</div>
              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                {cluster.sustainability.risks.slice(0, 3).map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* 2-Column Details */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Matching Interests (RIASEC) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Matching Interests
            </h4>

            <div className="flex flex-wrap gap-2">
              {cluster.interestFit.matchedTraits.length > 0 ? (
                cluster.interestFit.matchedTraits.map((t) => (
                  <span
                    key={t.code}
                    className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      t.strength === "core"
                        ? "bg-indigo-50 text-indigo-700 border-indigo-100"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                    }`}
                  >
                    {t.label}
                    {t.strength === "core" ? (
                      <span className="ml-2 text-[10px] font-semibold text-indigo-600 bg-white/70 px-1.5 py-0.5 rounded border border-indigo-100">
                        CORE
                      </span>
                    ) : null}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No major interest matches detected.</span>
              )}
            </div>

            {cluster.interestFit.missingTraits.length > 0 && (
              <div className="pt-2 text-xs text-gray-500 space-y-1">
                <div className="font-semibold text-gray-400 uppercase tracking-wider">
                  Potential Gaps
                </div>
                <ul className="list-disc pl-4 space-y-1">
                  {cluster.interestFit.missingTraits.slice(0, 2).map((m) => (
                    <li key={m.code}>{m.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Pathways (Broad arenas from taxonomy) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Common Pathways
            </h4>
            <div className="flex flex-wrap gap-2">
              {cluster.pathways.slice(0, 6).map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 shadow-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---

export default function CareerClustersPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof generateCareerClusters>> | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setError(null);
        setBusy(true);
        const res = await generateCareerClusters(user, rid);
        setData(res);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load career clusters.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto" />
          <p className="text-gray-500 text-sm">Analyzing your interests...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto py-20 px-6 text-center">
        <div className="text-red-600 mb-2">Error loading results</div>
        <p className="text-gray-600 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-6 btn btn-ghost">
          Try Again
        </button>
      </div>
    );
  }

  // Top 5 for main view, next 6 for "Other Options"
  const topClusters = data.clusters.slice(0, 5);
  const otherClusters = data.clusters.slice(5, 9);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <ReportNav rid={rid} />

      {/* Header */}
      <FadeIn>
        <header className="text-center space-y-5 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Your Top Career Clusters
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            We’ve analyzed your <strong>RIASEC interest profile</strong> against broad “worlds of work”
            — clusters that group roles by the kinds of problems, environments, and motivations they reward.
            This section explains <strong>why</strong> each cluster fits and where the tradeoffs are.
          </p>
        </header>
      </FadeIn>

      {/* Top 3 List */}
      <section className="space-y-8">
        {topClusters.map((c, i) => (
          <FadeIn key={c.key} delayIndex={i}>
            <ClusterCard cluster={c} index={i} />
          </FadeIn>
        ))}
      </section>

      {/* Other Clusters Section */}
      <section className="space-y-6 pt-8 border-t border-gray-100">
        <FadeIn delayIndex={5}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gray-300 rounded-full" />
            <h2 className="text-xl font-semibold text-gray-700">Other Clusters Worth Exploring</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            These ranked lower based on your current interest profile, but there may still be specific niches
            or role-types inside them that click for you.
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            {otherClusters.map((c) => (
              <div
                key={c.key}
                className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-gray-700">{c.label}</div>
                  <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">
                    {c.score}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {c.pathways.slice(0, 3).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Navigation */}
      <FadeIn
        delayIndex={5}
        className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4 items-center border-t border-gray-100"
      >
        <button
          onClick={() => router.push(`/app/report/decision-making?rid=${rid}`)}
          className="text-gray-500 hover:text-gray-900 font-medium transition-colors"
        >
          ← Back: Decisions
        </button>
        <button
          onClick={() => router.push(`/app/report/example-roles?rid=${rid}`)}
          className="btn btn-primary px-8 py-3 text-lg shadow-lg shadow-sky-200"
        >
          Next: Specific Roles →
        </button>
      </FadeIn>
    </div>
  );
}