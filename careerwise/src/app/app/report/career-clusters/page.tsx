"use client";

import { useEffect, useState, useRef } from "react";
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

function MatchBadge({ level }: { level: "High" | "Medium" | "Low" }) {
  const styles = {
    High: "bg-emerald-100 text-emerald-800 border-emerald-200",
    Medium: "bg-amber-100 text-amber-800 border-amber-200",
    Low: "bg-gray-100 text-gray-600 border-gray-200",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[level]}`}>
      {level} Match
    </span>
  );
}

function ClusterCard({ 
  cluster, 
  index 
}: { 
  cluster: Awaited<ReturnType<typeof generateCareerClusters>>["clusters"][number];
  index: number; 
}) {
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
              {cluster.score}% Fit
            </span>
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{cluster.label}</h3>
          <p className="text-base text-gray-600 leading-relaxed max-w-2xl">
            {cluster.description}
          </p>
        </div>

        <div className="h-px bg-gray-100 w-full" />

        {/* 2-Column Details */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Why it fits (RIASEC Tags ONLY) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Matching Interests
            </h4>
            <div className="flex flex-wrap gap-2">
              {cluster.matchSignals.length > 0 ? (
                cluster.matchSignals.map((signal, i) => (
                  <span 
                    key={i} 
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100"
                  >
                    {signal}
                  </span>
                ))
              ) : (
                <span className="text-sm text-gray-500 italic">No strong interest overlap.</span>
              )}
            </div>
          </div>

          {/* Pathways (Broad Roles from Taxonomy) */}
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
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
        <button onClick={() => window.location.reload()} className="mt-6 btn btn-ghost">Try Again</button>
      </div>
    );
  }

  // Top 3 for main view, next 6 for "Other Options"
  const topClusters = data.clusters.slice(0, 3);
  const otherClusters = data.clusters.slice(3, 9); 

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
            We’ve analyzed your <strong>RIASEC interest profile</strong> against the 16 National Career Clusters—a government-backed framework used to organize the entire U.S. job market. Based on decades of data, these are the worlds of work where your natural interests align best.
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

      {/* Other Industries Section */}
      <section className="space-y-6 pt-8 border-t border-gray-100">
        <FadeIn delayIndex={3}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gray-300 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-700">Other Industries Worth Exploring</h2>
          </div>
          <p className="text-gray-500 text-sm mb-4">
            These clusters had lower match scores based on your primary interests, but you might still find specific roles here that appeal to you.
          </p>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {otherClusters.map((c, i) => (
              <div key={c.key} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium text-gray-700">{c.label}</div>
                  <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">
                    {c.score}%
                  </span>
                </div>
                {/* Short list of pathways for context */}
                <div className="text-xs text-gray-500 truncate">
                  {c.pathways.slice(0, 3).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      {/* Navigation */}
      <FadeIn delayIndex={5} className="pt-8 flex flex-col-reverse sm:flex-row justify-between gap-4 items-center border-t border-gray-100">
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