'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

type RIASECProfile = { R: number; I: number; A: number; S: number; E: number; C: number };

type AnalysisJSON = {
  summary: string;
  strengths: string[];
  growthAreas: string[];
  topCareers: Array<{ title: string; whyMatch: string; successTraits: string[]; firstSteps: string[] }>;
  nextSteps: string[];
};

type ResultDoc = {
  rid: string;
  profile: { riasec: RIASECProfile; dominantTraits?: string[] };
  matchingCareers?: Array<{ title: string; score?: number }>;
  analysisJson?: AnalysisJSON;
  analysis?: string; // markdown (legacy)
  completedAt?: string;
};

const STEPS = ['overview', 'riasec', 'misaligned', 'aligned'] as const;
type StepKey = typeof STEPS[number];

/** ---------------- Helper: tiny fade/slide reveal ---------------- */
function useReveal() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShown(true), 10);
    return () => clearTimeout(t);
  }, []);
  return shown ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3';
}

/** ---------------- Temporary heuristic for broad industries --------
 * Replace with the O*NET-driven vectors later.
 */
const BROAD_INDUSTRIES = [
  'Arts & Media',
  'Healthcare',
  'Engineering & Tech',
  'Business & Entrepreneurship',
  'Social & Education',
  'Hands-on Trades',
  'Data & Research',
  'Office & Administration',
] as const;

type BroadIndustry = typeof BROAD_INDUSTRIES[number];

function rankIndustries(profile: RIASECProfile): BroadIndustry[] {
  // Weight matrix (temporary!): rows=industry, cols=R I A S E C
  const W: Record<BroadIndustry, [number, number, number, number, number, number]> = {
    'Arts & Media':              [0.2, 0.3, 1.0, 0.4, 0.5, 0.1],
    'Healthcare':                [0.3, 0.5, 0.2, 0.9, 0.2, 0.2],
    'Engineering & Tech':        [0.6, 1.0, 0.2, 0.2, 0.3, 0.4],
    'Business & Entrepreneurship':[0.2, 0.3, 0.3, 0.3, 1.0, 0.5],
    'Social & Education':        [0.1, 0.4, 0.4, 1.0, 0.2, 0.2],
    'Hands-on Trades':           [1.0, 0.2, 0.1, 0.2, 0.3, 0.2],
    'Data & Research':           [0.2, 1.0, 0.2, 0.3, 0.2, 0.6],
    'Office & Administration':   [0.1, 0.2, 0.1, 0.3, 0.4, 1.0],
  };

  const v = [profile.R, profile.I, profile.A, profile.S, profile.E, profile.C];
  return [...BROAD_INDUSTRIES]
    .map((ind) => {
      const w = W[ind];
      const score = w[0]*v[0] + w[1]*v[1] + w[2]*v[2] + w[3]*v[3] + w[4]*v[4] + w[5]*v[5];
      return { ind, score };
    })
    .sort((a, b) => b.score - a.score)
    .map(x => x.ind);
}

function top3Keys(p: RIASECProfile): Array<keyof RIASECProfile> {
  return (Object.entries(p) as Array<[keyof RIASECProfile, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([k]) => k);
}

/** ---------------- Slide components ---------------- */
function SectionCard(props: { title: string; children: React.ReactNode; footer?: React.ReactNode }) {
  const cls = useReveal();
  return (
    <div className={`rounded-2xl border p-6 bg-white shadow-[var(--shadow-1)] transition-all ${cls}`}>
      <h2 className="text-2xl font-semibold mb-3">{props.title}</h2>
      <div className="space-y-4">{props.children}</div>
      {props.footer ? <div className="mt-6 pt-4 border-t">{props.footer}</div> : null}
    </div>
  );
}

function AgreeBlock({
  onAgree,
  onDisagree,
  busy,
  ask = 'Does that sound right?',
  allowText = true,
  feedback,
  setFeedback,
}: {
  onAgree: () => void;
  onDisagree: () => void;
  busy?: boolean;
  ask?: string;
  allowText?: boolean;
  feedback?: string;
  setFeedback?: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-sm text-gray-600">{ask}</div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onAgree}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg bg-black text-white text-sm disabled:opacity-60"
        >
          Yep
        </button>
        <button
          onClick={onDisagree}
          disabled={busy}
          className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-60"
        >
          Not quite
        </button>
      </div>
      {allowText && setFeedback ? (
        <textarea
          className="mt-1 w-full form-field"
          rows={3}
          placeholder="Add context (optional)…"
          value={feedback || ''}
          onChange={(e) => setFeedback(e.target.value)}
        />
      ) : null}
    </div>
  );
}

function RIASECBar({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  const pct = Math.max(0, Math.min(100, Math.round(value * 10))) / 10; // keep original scale feel
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className={highlight ? 'font-semibold' : ''}>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${highlight ? 'bg-gradient-to-r from-cyan-400 to-violet-500' : 'bg-gray-800'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** ---------------- Page ---------------- */
export default function ResultsWrappedPage() {
  const sp = useSearchParams();
  const ridParam = sp.get('rid') || undefined;

  const { user, loading } = useAuth();
  const router = useRouter();

  const [stepIndex, setStepIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [rid, setRid] = useState<string | null>(null);
  const [result, setResult] = useState<ResultDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  // lightweight feedback capture (could save to Firestore later)
  const [feedback, setFeedback] = useState<Record<StepKey, string>>({
    overview: '',
    riasec: '',
    misaligned: '',
    aligned: '',
  } as any);

  // Load (or generate) results
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setBusy(true);
        setError(null);
        if (!user) return;
        const token = await user.getIdToken();

        // 1) Determine rid
        let rid = ridParam || '';
        if (!rid) {
          // Try to get a working draft rid via your existing entry endpoint.
          const r = await fetch('/api/quiz/entry', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({}),
          });
          const j = r.ok ? await r.json() : null;
          rid = j?.rid || '';
        }
        if (!rid) {
          setError('No profile draft found. Please complete your quizzes first.');
          return;
        }

        // 2) Try to fetch an existing result
        let got: ResultDoc | null = null;
        {
          const res = await fetch(`/api/results?rid=${encodeURIComponent(rid)}`, {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (res.ok) {
            const data = await res.json();
            got = (data?.result || null) as ResultDoc | null;
          }
        }

        // 3) If none, trigger computation now
        if (!got) {
          const post = await fetch('/api/results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({ rid, mode: 'final' }),
          });
          if (!post.ok) {
            const t = await post.text();
            throw new Error(`Failed to compute results: ${t}`);
          }
          // Fetch again
          const res2 = await fetch(`/api/results?rid=${encodeURIComponent(rid)}`, {
            headers: { Authorization: 'Bearer ' + token },
          });
          if (!res2.ok) throw new Error(await res2.text());
          const data2 = await res2.json();
          got = (data2?.result || null) as ResultDoc | null;
        }

        if (!alive) return;
        setRid(rid);
        setResult(got);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message || 'Something went wrong loading your results.');
      } finally {
        if (!alive) return;
        setBusy(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [user, ridParam]);
  
  useEffect(() => {
      if (!loading && !user) router.replace('/login?next=/app/results');
    }, [loading, user, router]);
    
    const riasec = result?.profile?.riasec || { R:0,I:0,A:0,S:0,E:0,C:0 };
    const top3 = useMemo(() => top3Keys(riasec), [riasec]);
    const ranked = useMemo(() => rankIndustries(riasec), [riasec]);
    const misaligned = ranked.slice(-3).reverse();
    const aligned = ranked.slice(0, 3);
    
  if (loading || busy) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="text-sm text-gray-600">Loading your results…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="rounded-xl border p-4 bg-white">
          <div className="text-red-600 font-medium mb-2">We couldn’t load your results</div>
          <div className="text-sm text-gray-600 mb-4">{error}</div>
          <button className="btn btn-primary" onClick={() => router.push('/app')}>Back to dashboard</button>
        </div>
      </div>
    );
  }
  if (!result) return null;


  const step: StepKey = STEPS[stepIndex];

  function next() {
    setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  }
  function prev() {
    setStepIndex((i) => Math.max(i - 1, 0));
  }
  function recordAgree(_s: StepKey) {
    // placeholder: could POST to /api/feedback later
    next();
  }
  function recordDisagree(_s: StepKey) {
    // same as above; you may open a textarea automatically, but we already show it
    next();
  }

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Step {stepIndex + 1} / {STEPS.length}
        </div>
        <div className="flex gap-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 w-8 rounded-full ${i <= stepIndex ? 'bg-black' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>

      {step === 'overview' && (
        <SectionCard title="What we know about you">
          <p className="text-gray-800 leading-relaxed">
            {result.analysisJson?.summary ||
              'We combined your profile inputs and interest signals to form a first-pass picture of where you thrive.'}
          </p>

          {/* Optional bullets if present */}
          {result.analysisJson?.strengths?.length ? (
            <div>
              <div className="font-medium mb-1">Strengths</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {result.analysisJson.strengths.slice(0, 5).map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          ) : null}

          <AgreeBlock
            onAgree={() => recordAgree('overview')}
            onDisagree={() => recordDisagree('overview')}
            feedback={feedback.overview}
            setFeedback={(v) => setFeedback((f) => ({ ...f, overview: v }))}
            ask="Does this summary feel accurate?"
          />
        </SectionCard>
      )}

      {step === 'riasec' && (
        <SectionCard title="Your RIASEC profile">
          <div className="grid grid-cols-1 gap-3">
            <RIASECBar label="Realistic (R)"  value={riasec.R} highlight={top3.includes('R')} />
            <RIASECBar label="Investigative (I)" value={riasec.I} highlight={top3.includes('I')} />
            <RIASECBar label="Artistic (A)" value={riasec.A} highlight={top3.includes('A')} />
            <RIASECBar label="Social (S)"       value={riasec.S} highlight={top3.includes('S')} />
            <RIASECBar label="Enterprising (E)"  value={riasec.E} highlight={top3.includes('E')} />
            <RIASECBar label="Conventional (C)"  value={riasec.C} highlight={top3.includes('C')} />
          </div>

          <div className="rounded-lg bg-[--surface] border p-3 text-sm">
            <div className="font-medium mb-1">Your top three</div>
            <div className="flex flex-wrap gap-2">
              {top3.map((k) => (
                <span key={k} className="px-2 py-1 rounded-full bg-black text-white text-xs">
                  {k}
                </span>
              ))}
            </div>
          </div>

          <AgreeBlock
            onAgree={() => recordAgree('riasec')}
            onDisagree={() => recordDisagree('riasec')}
            feedback={feedback.riasec}
            setFeedback={(v) => setFeedback((f) => ({ ...f, riasec: v }))}
            ask="Does this sound like you?"
          />
        </SectionCard>
      )}

      {step === 'misaligned' && (
        <SectionCard title="Paths that may not fit you (at this stage)">
          <p className="text-sm text-gray-600">
            Based on your interest pattern, these broad categories may be less aligned.
            (We’ll refine this with official data soon.)
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            {misaligned.map((ind) => (
              <div key={ind} className="rounded-xl border p-4 bg-white">
                <div className="font-medium">{ind}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Likely to feel less energizing day-to-day relative to stronger matches.
                </p>
              </div>
            ))}
          </div>

          <AgreeBlock
            onAgree={() => recordAgree('misaligned')}
            onDisagree={() => recordDisagree('misaligned')}
            feedback={feedback.misaligned}
            setFeedback={(v) => setFeedback((f) => ({ ...f, misaligned: v }))}
            ask="Would you agree?"
          />
        </SectionCard>
      )}

      {step === 'aligned' && (
        <SectionCard title="Areas you may excel in">
          <p className="text-sm text-gray-600">
            These categories look promising given your interests. We’ll personalize further as your profile grows.
          </p>
          <div className="grid sm:grid-cols-3 gap-3 mt-2">
            {aligned.map((ind) => (
              <div key={ind} className="rounded-xl border p-4 bg-white">
                <div className="font-medium">{ind}</div>
                <p className="text-xs text-gray-600 mt-1">
                  Stronger match to your top interest signals.
                </p>
              </div>
            ))}
          </div>

          <AgreeBlock
            onAgree={() => recordAgree('aligned')}
            onDisagree={() => recordDisagree('aligned')}
            feedback={feedback.aligned}
            setFeedback={(v) => setFeedback((f) => ({ ...f, aligned: v }))}
            ask="Does this feel on-track?"
          />
          <div className="text-right">
            <a href="/app/pro" className="inline-block mt-4 px-3 py-1.5 rounded-lg bg-black text-white text-sm">
              Go deeper with PRO
            </a>
          </div>
        </SectionCard>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-2">
        <button
          onClick={prev}
          disabled={stepIndex === 0}
          className="px-3 py-1.5 rounded-lg border text-sm disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={next}
          disabled={stepIndex >= STEPS.length - 1}
          className="px-3 py-1.5 rounded-lg bg-black text-white text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}