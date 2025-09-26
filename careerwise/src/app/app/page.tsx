'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppHome() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function startOrResume() {
    try {
      setBusy(true);
      // Minimal: call your existing "entry" endpoint to create/load a draft and route correctly.
      // It expects an Authorization header; assume your frontend sets it globally or uses fetch interceptor.
      const token = (window as any).__ID_TOKEN__ || (await (window as any).getIdToken?.());
      if (!token) return router.push('/login?next=/app');

      const res = await fetch('/api/quiz/entry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({}),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      // API returns a destination path in your current flow; fall back to /app/quiz/intake.
      const dest = data?.destination || '/app/quiz/intake';
      router.push(dest);
    } catch (e) {
      console.error(e);
      alert('Something went wrong starting your profile.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Welcome back</h1>
      <p className="text-gray-700">Build your career profile, see results, and go deeper with PRO.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card
          title="Career Profile"
          body="Start or continue your profile (intake → macro → RIASEC)."
          actions={<button onClick={startOrResume} disabled={busy} className="px-3 py-1.5 rounded-lg bg-black text-white text-sm">{busy ? 'Loading…' : 'Start / Resume'}</button>}
        />
        <Card
          title="Results"
          body="View your latest results in a Spotify-Wrapped style (coming alive next)."
          actions={<a href="/app/results" className="px-3 py-1.5 rounded-lg border text-sm">View results</a>}
        />
        <Card
          title="Upgrade to PRO"
          body="Unlock the Big-5 Personality test and richer insights."
          actions={<a href="/app/pro" className="px-3 py-1.5 rounded-lg bg-black text-white text-sm">Go PRO</a>}
        />
      </div>
    </section>
  );
}

function Card({ title, body, actions }: { title:string; body:string; actions: React.ReactNode }) {
  return (
    <div className="rounded-2xl border p-4 bg-white">
      <div className="font-semibold mb-1">{title}</div>
      <p className="text-sm text-gray-700 mb-3">{body}</p>
      <div>{actions}</div>
    </div>
  );
}