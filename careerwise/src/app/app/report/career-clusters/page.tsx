"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateCareerClusters } from "@/app/lib/results/generators/generate-career-clusters";
import ReportNav from "@/app/components/ReportNav";

// --- Components ---

/**
 * Scroll-triggered fade-in animation component.
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

  const delay = delayIndex * 100;

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
  const isTop = index === 0;
  
  return (
    <div className={`group relative overflow-hidden rounded-2xl border transition-all hover:shadow-md ${
      isTop ? "bg-white border-sky-200 ring-4 ring-sky-50 shadow-sm" : "bg-white border-gray-200"
    }`}>
      {/* Visual Header */}
      <div className="p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">{cluster.label}</h3>
              <MatchBadge level={cluster.matchLevel} />
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xl">
              {cluster.description}
            </p>
          </div>
          
          {/* Score Circle (Visual) */}
          <div className="shrink-0 flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wider">Fit Score</div>
              <div className="text-lg font-bold text-gray-700">{cluster.score}%</div>
            </div>
            <div className="relative w-12 h-12">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                <path 
                  className={cluster.matchLevel === "High" ? "text-emerald-500" : cluster.matchLevel === "Medium" ? "text-amber-500" : "text-gray-400"} 
                  strokeDasharray={`${cluster.score}, 100`} 
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="3" 
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gray-100 w-full" />

        {/* Evidence & Roles */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Why it fits</h4>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
              {cluster.rationale}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Role Examples</h4>
            <div className="flex flex-wrap gap-2">
              {cluster.exampleRoles.map((role) => (
                <span 
                  key={role} 
                  className="px-3 py-1 bg-white border border-gray-200 rounded-md text-sm text-gray-700 shadow-sm"
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
          <p className="text-gray-500 text-sm">Mapping your profile to the job market...</p>
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

  // Filter mainly high/medium matches for the primary view, but show at least 5
  const topClusters = data.clusters.slice(0, 5);
  const otherClusters = data.clusters.slice(5);

  return (
    <div className="max-w-4xl mx-auto px-6 py-16 space-y-12">
      <ReportNav rid={rid} />
      
      {/* Header */}
      <FadeIn>
        <header className="text-center space-y-4 mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Career Clusters
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We’ve analyzed 16 major industry groups against your interests and preferences. Here are the fields where you are most likely to thrive.
          </p>
        </header>
      </FadeIn>

      {/* Top Matches Section */}
      <section className="space-y-6">
        <FadeIn>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-8 w-1 bg-sky-500 rounded-full"></div>
            <h2 className="text-2xl font-semibold text-gray-900">Your Top Matches</h2>
          </div>
        </FadeIn>

        <div className="space-y-6">
          {topClusters.map((c, i) => (
            <FadeIn key={c.key} delayIndex={i}>
              <ClusterCard cluster={c} index={i} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Other Clusters (Collapsed/Simplified) */}
      <section className="space-y-6 pt-8 border-t border-gray-100">
        <FadeIn delayIndex={3}>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-gray-300 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-700">Other Industries to Consider</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4">
            {otherClusters.slice(0, 6).map((c, i) => (
              <div key={c.key} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white transition-colors">
                <div className="flex justify-between items-start">
                  <div className="font-medium text-gray-700">{c.label}</div>
                  <span className="text-xs font-medium text-gray-400 bg-white px-2 py-1 rounded border border-gray-100">
                    {c.score}%
                  </span>
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