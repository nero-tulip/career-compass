"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import CareerCard from "@/app/components/CareerCard";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/app/providers/AuthProvider";
import { getAuth } from "firebase/auth";

interface CareerMatch {
  code: string;
  title: string;
  riasec: {
    R: number;
    I: number;
    A: number;
    S: number;
    E: number;
    C: number;
  };
}

interface ResultsData {
  profile: {
    riasec: {
      R: number;
      I: number;
      A: number;
      S: number;
      E: number;
      C: number;
    };
    dominantTraits: string[];
  };
  matchingCareers: CareerMatch[];
  analysis: string;
}

export default function ResultsPage() {
  const sp = useSearchParams();
  const router = useRouter();
  const rid = sp.get("rid") || "";
  const { user, loading } = useAuth();

  const [results, setResults] = useState<ResultsData | null>(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Gate: require auth & rid
  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/start");
      return;
    }
    if (!rid) {
      setError("Missing result id.");
      setLoadingPage(false);
      return;
    }

    const fetchResult = async () => {
      try {
        const idToken = await getAuth().currentUser?.getIdToken();
        if (!idToken) {
          setError("Not authenticated.");
          setLoadingPage(false);
          return;
        }

        const res = await fetch(`/api/results?rid=${encodeURIComponent(rid)}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          setError(j?.error || "Failed to load results.");
          setLoadingPage(false);
          return;
        }

        const data = await res.json();

        // Shape coming back from API route:
        // {
        //   success: true,
        //   rid,
        //   result: {
        //     type, rid, profile: { riasec, dominantTraits }, matchingCareers, analysis, ...
        //   }
        // }
        const result = data?.result || {};

        // Normalize careers for CareerCard (ensure `code` exists)
        const normalizedCareers: CareerMatch[] = (result?.matchingCareers || []).map(
          (c: any) => ({
            code: c.code || (c.title ? c.title.toLowerCase().replace(/\s+/g, "-") : crypto.randomUUID()),
            title: c.title,
            riasec: c.riasec || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
          })
        );

        const mapped: ResultsData = {
          profile: {
            riasec: result?.profile?.riasec || { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 },
            dominantTraits: result?.profile?.dominantTraits || [],
          },
          matchingCareers: normalizedCareers,
          analysis: result?.analysis || "",
        };

        setResults(mapped);
        setLoadingPage(false);
      } catch (e) {
        console.error("Failed to load results:", e);
        setError("Failed to load results.");
        setLoadingPage(false);
      }
    };

    fetchResult();
  }, [loading, user, rid, router]);

  const riasecLabels = useMemo(
    () =>
      ({
        R: "Realistic",
        I: "Investigative",
        A: "Artistic",
        S: "Social",
        E: "Enterprising",
        C: "Conventional",
      } as const),
    []
  );

  const dominantLabels = useMemo(() => {
    if (!results) return "";
    return (results.profile.dominantTraits || [])
      .map((trait) => riasecLabels[trait as keyof typeof riasecLabels] || trait)
      .join(", ");
  }, [results, riasecLabels]);

  if (loading || loadingPage) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-lg">Analyzing your career profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error</h2>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!results) return null;

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-center mb-8">
        Your career profile
      </h1>

      <div className="grid lg:grid-cols-3 gap-6 items-start mb-8">
        <div className="lg:col-span-2 surface-2 p-6">
          <h2 className="text-lg font-semibold mb-4">RIASEC breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(results.profile.riasec).map(([key, value]) => (
              <div key={key} className="card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {riasecLabels[key as keyof typeof riasecLabels]}
                  </span>
                  <span className="font-semibold">
                    {Number(value).toFixed(1)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bar-track overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${(Number(value) / 7) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm muted">
            <span className="font-medium">Dominant traits:</span> {dominantLabels}
          </p>
        </div>
        <div className="surface-2 p-6">
          <h2 className="text-lg font-semibold mb-2">Top matches</h2>
          <div className="space-y-3">
            {results.matchingCareers?.slice(0, 3).map((c) => (
              <CareerCard key={c.code} career={c} />
            ))}
          </div>
        </div>
      </div>

      <div className="surface-2 p-8">
        <h2 className="text-2xl font-semibold mb-4 text-center">
          What this means for you
        </h2>
        <div className="prose max-w-none">
          <ReactMarkdown
            components={{
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              h3: (props: any) => (
                <h3 className="text-xl md:text-2xl font-bold mt-6 mb-3" {...props} />
              ),
            }}
          >
            {results.analysis}
          </ReactMarkdown>
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-3">
        <button
          onClick={() => {
            // start a fresh draft flow
            router.push("/start");
          }}
          className="btn btn-primary"
        >
          Start a new quiz
        </button>
        <button onClick={() => window.print()} className="btn btn-outline">
          Print
        </button>
      </div>
    </div>
  );
}