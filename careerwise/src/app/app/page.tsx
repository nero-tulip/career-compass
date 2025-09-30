// src/app/app/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';

type ModuleKey =
  | 'profileBasics'   // (old "intake")
  | 'careerPrefs'     // (macro)
  | 'riasec'          // (riasec)
  | 'results'         // (wrapped results)
  | 'big5'            // PRO
  | 'mentors'         // PRO (future)
  | 'resources';      // free (future)

type ModuleDef = {
  key: ModuleKey;
  title: string;
  subtitle?: string;
  kind: 'quiz' | 'output' | 'service';
  tier: 'free' | 'pro';
  startPath?: string;
  viewPath?: string;
  icon?: string;
};

const MODULES: ModuleDef[] = [
  { key: 'profileBasics', title: 'Introduction', subtitle: 'Let’s get to know you', kind: 'quiz', tier: 'free', icon: '👋' },
  { key: 'careerPrefs',   title: 'Career Preferences', subtitle: 'What work feels good?', kind: 'quiz', tier: 'free', icon: '🎯' },
  { key: 'riasec',        title: 'RIASEC Analysis', subtitle: 'What energizes you?', kind: 'quiz', tier: 'free', icon: '🧩' },
  { key: 'big5',          title: 'Big-5 Personality', subtitle: 'Go deeper with PRO', kind: 'quiz', tier: 'pro', startPath: '/app/quiz/big5', icon: '🧠' },
  { key: 'mentors',       title: 'Mentor Matches', subtitle: 'Guidance from pros', kind: 'service', tier: 'pro', viewPath: '/app/mentors', icon: '🤝' },
  { key: 'resources',     title: 'Resources', subtitle: 'Learn & level up', kind: 'service', tier: 'free', viewPath: '/app/resources', icon: '📚' },
  { key: 'results',       title: 'Your Results', subtitle: 'See matches & insights', kind: 'output', tier: 'free', viewPath: '/app/results', icon: '📊' },
];

export default function AppHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);

  async function handleStartOrResume(mod: ModuleDef) {
    if (loading || busyKey) return;
    try {
      setBusyKey(mod.key);
      if (!user) return router.push('/login?next=/app');

      if (mod.kind === 'quiz' && mod.tier === 'free') {
        const token = await user.getIdToken?.();

        // Map dashboard card -> section param for API
        const section =
          mod.key === 'profileBasics' ? 'intake' :
          mod.key === 'careerPrefs'   ? 'macro'  :
          mod.key === 'riasec'        ? 'riasec' : 'intake';

        const res = await fetch('/api/quiz/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ section }), // <-- step 3: section-aware
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // Server returns rid-aware destination like /app/quiz/<section>?rid=...
        const dest = data?.destination || `/app/quiz/${section}`;
        router.push(dest);
        return;
      }

      // Non-quiz or custom
      router.push(mod.viewPath || mod.startPath || '/app');
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please try again.');
    } finally {
      setBusyKey(null);
    }
  }

  function handleView(mod: ModuleDef) {
    router.push(mod.viewPath || '/app');
  }

  // TODO: read users/{uid}.entitlement to unlock PRO
  const isPro = false;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Your CareerCompass</h1>
      <p className="text-gray-700">Build your profile, explore insights, and go deeper with PRO.</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => {
          const locked = m.tier === 'pro' && !isPro;
          const busy = busyKey === m.key;
          const primaryCta =
            m.kind === 'quiz' ? (locked ? 'Unlock PRO' : 'Open') : (locked ? 'Unlock PRO' : 'View');
          const onPrimary =
            m.kind === 'quiz'
              ? () => (locked ? router.push('/app/pro') : handleStartOrResume(m))
              : () => (locked ? router.push('/app/pro') : handleView(m));

          return (
            <ModuleCard
              key={m.key}
              title={m.title}
              subtitle={m.subtitle}
              icon={m.icon}
              tier={m.tier}
              locked={locked}
              busy={busy}
              onPrimary={onPrimary}
              primaryLabel={busy ? 'Loading…' : primaryCta}
            />
          );
        })}
      </div>
    </section>
  );
}

function ModuleCard(props: {
  title: string;
  subtitle?: string;
  icon?: string;
  tier: 'free' | 'pro';
  locked?: boolean;
  busy?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
}) {
  const { title, subtitle, icon, tier, locked, busy, primaryLabel, onPrimary } = props;

  return (
    <div className={['rounded-2xl border p-4 bg-white flex flex-col justify-between', locked ? 'opacity-90 border-purple-300' : ''].join(' ')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 grid place-items-center text-lg">{icon ?? '🧭'}</div>
          <div>
            <div className="font-semibold">{title}</div>
            {subtitle ? <div className="text-xs text-gray-600">{subtitle}</div> : null}
          </div>
        </div>
        <Badge tier={tier} locked={!!locked} />
      </div>

      {/* Progress stub — wire real progress later */}
      <div className="mt-4">
        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full"
            style={{
              width: locked ? '0%' : '20%',
              background: locked
                ? 'linear-gradient(90deg,#a78bfa,#f472b6)'
                : 'linear-gradient(90deg,#22d3ee,#a855f7)',
            }}
          />
        </div>
        <div className="mt-1 text-[11px] text-gray-500">
          {locked ? 'Locked' : 'Progress: starter'}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onPrimary}
          disabled={busy}
          className={['px-3 py-1.5 rounded-lg text-sm', locked ? 'bg-purple-600 text-white' : 'bg-black text-white'].join(' ')}
        >
          {primaryLabel}
        </button>
      </div>
    </div>
  );
}

function Badge({ tier, locked }: { tier: 'free' | 'pro'; locked: boolean }) {
  if (tier === 'pro') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
        {locked ? '🔒' : '⭐️'} PRO
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
      Free
    </span>
  );
}