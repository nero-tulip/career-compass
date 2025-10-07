'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/app/lib/firebase';
import { getAuth } from 'firebase/auth';

type PromptVars = {
  role: string;
  location: string;
  seniority?: string;
  timeline?: string;
  constraints?: string;
  budget?: string;
};

type ResourceItem = {
  title: string;
  type: 'article' | 'course' | 'community' | 'tool';
  url?: string;
  summary: string;
  why: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
};
type RoadmapItem = { step: string; detail: string; estTime?: string; references?: string[] };
type RoadmapPhase = { phase: number; title: string; items: RoadmapItem[] };

type PackDoc = {
  prompt: PromptVars;
  usesProfile: boolean;
  status: 'ready' | 'running' | 'error';
  generated?: {
    explainer: string;
    roadmap: RoadmapPhase[];
    resources: ResourceItem[];
  };
  createdAt?: any;
  updatedAt?: any;
  version?: number;
};

export default function ResourcesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [vars, setVars] = useState<PromptVars>({ role: '', location: '' });
  const [usesProfile, setUsesProfile] = useState(true);
  const [packId, setPackId] = useState<string | null>(null);
  const [pack, setPack] = useState<PackDoc | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login?next=/app/resources');
  }, [loading, user, router]);

  const canGenerate =
    vars.role.trim().length > 1 && vars.location.trim().length > 1 && !busy;

  async function run() {
    if (!user) return;
    setBusy(true);
    try {
      const idToken = await getAuth().currentUser?.getIdToken();
      if (!idToken) throw new Error('Not authenticated');

      const res = await fetch('/api/resources/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ prompt: vars, usesProfile }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPackId(data.id);

      // Fetch once
      const ref = doc(db, 'users', user.uid, 'resources', data.id);
      const snap = await getDoc(ref);
      if (snap.exists()) setPack(snap.data() as PackDoc);
    } catch (e: any) {
      alert(e.message || 'Failed to generate resources');
    } finally {
      setBusy(false);
    }
  }

  // Optional: live polling (to see updates)
  useEffect(() => {
    let t: any;
    if (!user || !packId) return;
    const poll = async () => {
      const ref = doc(db, 'users', user.uid, 'resources', packId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const d = snap.data() as PackDoc;
        setPack(d);
        if (d.status === 'running') t = setTimeout(poll, 1500);
      }
    };
    poll();
    return () => clearTimeout(t);
  }, [user, packId]);

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Resources & Roadmap</h1>
        <p className="text-gray-600">
          Describe what you want to explore. We’ll personalize a roadmap using
          your profile and live web data.
        </p>
      </header>

      {/* Prompt builder */}
      <div className="rounded-xl border bg-white p-4 space-y-3">
        <div className="flex flex-wrap gap-2 items-center text-lg">
          <span>I’m wanting to explore being</span>
          <input
            className="form-field w-56"
            placeholder="an accountant"
            value={vars.role}
            onChange={(e) => setVars((v) => ({ ...v, role: e.target.value }))}
          />
          <span>in</span>
          <input
            className="form-field w-56"
            placeholder="Australia"
            value={vars.location}
            onChange={(e) => setVars((v) => ({ ...v, location: e.target.value }))}
          />
        </div>

        <div className="grid sm:grid-cols-3 gap-2">
          <input
            className="form-field"
            placeholder="seniority (e.g., junior, career-switch)"
            value={vars.seniority || ''}
            onChange={(e) =>
              setVars((v) => ({
                ...v,
                seniority: e.target.value || undefined,
              }))
            }
          />
          <input
            className="form-field"
            placeholder="timeline (e.g., 3 months)"
            value={vars.timeline || ''}
            onChange={(e) =>
              setVars((v) => ({
                ...v,
                timeline: e.target.value || undefined,
              }))
            }
          />
          <input
            className="form-field"
            placeholder="constraints (e.g., part-time, no degree)"
            value={vars.constraints || ''}
            onChange={(e) =>
              setVars((v) => ({
                ...v,
                constraints: e.target.value || undefined,
              }))
            }
          />
        </div>

        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={usesProfile}
            onChange={(e) => setUsesProfile(e.target.checked)}
          />
          Use my profile (intake, macro, RIASEC, Big-5)
        </label>

        <div className="flex gap-2 justify-end">
          <button
            onClick={run}
            disabled={!canGenerate}
            className="btn btn-primary disabled:opacity-50"
          >
            {busy ? 'Working…' : 'Generate plan'}
          </button>
        </div>
      </div>

      {/* Output */}
      {pack?.generated ? (
        <div className="space-y-6">
          <section className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold mb-2">Explainer</h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {pack.generated.explainer}
            </p>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold mb-2">Roadmap</h2>
            <div className="space-y-4">
              {pack.generated.roadmap.map((ph) => (
                <div key={ph.phase} className="rounded-lg border p-3">
                  <div className="font-medium">
                    {ph.phase}. {ph.title}
                  </div>
                  <ul className="mt-2 space-y-2">
                    {ph.items.map((it, idx) => (
                      <li key={idx} className="text-sm">
                        <span className="font-medium">{it.step}.</span>{' '}
                        {it.detail}{' '}
                        {it.estTime ? (
                          <span className="text-gray-500">({it.estTime})</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border bg-white p-4">
            <h2 className="font-semibold mb-2">Resources</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {pack.generated.resources.map((r, i) => (
                <a
                  key={i}
                  href={r.url || '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border p-3 hover:shadow"
                >
                  <div className="text-sm text-gray-500">{r.type}</div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-sm text-gray-700 line-clamp-3">
                    {r.summary}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Why: {r.why}
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      ) : pack?.status === 'running' ? (
        <div className="text-sm text-gray-600">Generating your pack…</div>
      ) : null}
    </div>
  );
}