"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { generateExampleRoles } from "@/app/lib/results/generators/generate-example-roles";
import ReportNav from "@/app/components/ReportNav";
import { mapInterestsToProfile } from "@/app/lib/careerMatch";

function useReveal() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setV(true), 20);
    return () => clearTimeout(t);
  }, []);
  return v ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3";
}

export default function ExampleRolesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const rid = sp.get("rid") ?? "";

  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [data, setData] = useState<
    Awaited<ReturnType<typeof generateExampleRoles>> | null
  >(null);

  const reveal = useReveal();

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        setBusy(true);
        const res = await generateExampleRoles(user, rid);

        // DEBUG: Check your console (F12) to see if userProfile is arriving!
        console.log("Generators Output:", res);

        setData(res);
      } catch (e: any) {
        console.error(e);
        setError(e?.message ?? "Failed to load example roles.");
      } finally {
        setBusy(false);
      }
    })();
  }, [user, rid, loading]);

  if (loading || busy)
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-sm text-gray-600">
        Finding your best matches...
      </div>
    );
  if (error)
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-red-600">{error}</div>
    );
  if (!data) return null;

  return (
    <div
      className={`max-w-3xl mx-auto px-4 py-12 space-y-8 transition-all ${reveal}`}
    >
      <ReportNav rid={rid} />

      <header className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Top Career Matches
        </h1>
        <p className="text-gray-600">
          Based purely on your RIASEC profile (Algorithm Match).
        </p>
      </header>

      <div className="space-y-4">
        {data.matches.length === 0 && (
          <p className="text-center text-gray-500">
            No matches found. Please check your assessment data.
          </p>
        )}

        {data.matches.map((career) => {
          // ✅ Pull job RIASEC from the real source: attributes.Interest[]
          const jobProfile = mapInterestsToProfile(
            career.attributes?.Interest ?? []
          );

          return (
            <div
              key={career.id}
              className="p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {career.title}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {career.description}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full">
                    {((career as any).matchScore * 100).toFixed(0)}% Match
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {/* ✅ Avoid crash if Skills is undefined; also avoid mutating original array */}
                {(career.attributes.Skills ?? [])
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .slice(0, 3)
                  .map((skill) => (
                    <span
                      key={skill.name}
                      className="text-xs border px-2 py-1 rounded-md text-gray-600 bg-gray-50"
                    >
                      {skill.name}
                    </span>
                  ))}
              </div>

              {/* --- ALGORITHM PROOF --- */}
              <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono">
                <p className="font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Algorithm Logic Proof
                </p>

                <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center items-center">
                  {/* Header Row */}
                  <div className="font-bold text-left text-slate-400">SOURCE</div>
                  <div className="font-bold text-slate-500">R</div>
                  <div className="font-bold text-slate-500">I</div>
                  <div className="font-bold text-slate-500">A</div>
                  <div className="font-bold text-slate-500">S</div>
                  <div className="font-bold text-slate-500">E</div>
                  <div className="font-bold text-slate-500">C</div>

                  {/* User Row */}
                  <div className="font-bold text-left text-blue-600">YOU</div>
                  <div className="bg-white py-1 rounded border">
                    {data.userProfile?.R?.toFixed(1) ?? "?"}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {data.userProfile?.I?.toFixed(1) ?? "?"}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {data.userProfile?.A?.toFixed(1) ?? "?"}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {data.userProfile?.S?.toFixed(1) ?? "?"}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {data.userProfile?.E?.toFixed(1) ?? "?"}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {data.userProfile?.C?.toFixed(1) ?? "?"}
                  </div>

                  {/* Job Row */}
                  <div className="font-bold text-left text-green-600">JOB</div>
                  <div className="bg-white py-1 rounded border">
                    {jobProfile.R.toFixed(1)}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {jobProfile.I.toFixed(1)}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {jobProfile.A.toFixed(1)}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {jobProfile.S.toFixed(1)}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {jobProfile.E.toFixed(1)}
                  </div>
                  <div className="bg-white py-1 rounded border">
                    {jobProfile.C.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between pt-8">
        <button
          onClick={() => router.push(`/app/report/career-clusters?rid=${rid}`)}
          className="btn btn-ghost"
        >
          ← Back: Career Clusters
        </button>
        <button
          onClick={() => router.push(`/app/report/next-steps?rid=${rid}`)}
          className="btn btn-primary"
        >
          Next: Next Steps →
        </button>
      </div>
    </div>
  );
}