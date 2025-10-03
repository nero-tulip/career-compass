'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

type Big5 = { E:number; A:number; C:number; N:number; O:number };
type Big5Result = { traits: Big5; computedAt: string };

function Bar({ label, value }: { label:string; value:number }) {
  const pct = Math.round((value / 5) * 100);
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="tabular-nums text-gray-600">{value.toFixed(2)}</span>
      </div>
      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
        <div className="h-full bg-gray-800" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function Big5ResultPage() {
  const sp = useSearchParams();
  const rid = sp.get('rid') || '';
  const { user, loading } = useAuth();
  const router = useRouter();

  const [result, setResult] = useState<Big5Result | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (loading) return;
      if (!user) return router.replace('/login?next=/app/results/big5');
      try {
        setBusy(true);
        setErr(null);
        const token = await user.getIdToken();
        const res = await fetch(`/api/results/section?rid=${encodeURIComponent(rid)}&section=big5`, {
          headers: { Authorization: 'Bearer ' + token },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setResult(data.result as Big5Result);
      } catch (e:any) {
        setErr(e.message || 'Failed to load Big-5 results.');
      } finally {
        setBusy(false);
      }
    })();
  }, [user, loading, rid, router]);

  if (loading || busy) return <div className="max-w-3xl mx-auto py-10 px-4">Loading…</div>;
  if (err) return <div className="max-w-3xl mx-auto py-10 px-4 text-red-600">{err}</div>;
  if (!result) return null;

  const t = result.traits;

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-2xl font-semibold">Your Big-5 Personality</h1>
      <p className="text-sm text-gray-600">Computed on {new Date(result.computedAt).toLocaleString()}</p>

      <div className="grid gap-3">
        <Bar label="Extraversion (E)" value={t.E} />
        <Bar label="Agreeableness (A)" value={t.A} />
        <Bar label="Conscientiousness (C)" value={t.C} />
        <Bar label="Neuroticism (N)" value={t.N} />
        <Bar label="Openness (O)" value={t.O} />
      </div>

      <div className="rounded-xl border p-4 bg-white text-sm text-gray-700">
        <div className="font-medium mb-1">How to read this</div>
        <p>Scores range from 1–5 (higher = more of that trait). This snapshot is based on your answers in the Big-5 questionnaire.</p>
      </div>

      <div className="flex justify-between">
        <a href="/app" className="btn btn-ghost">Back to dashboard</a>
        <a href={`/app/results?rid=${encodeURIComponent(rid)}`} className="btn btn-primary">See full report</a>
      </div>
    </div>
  );
}