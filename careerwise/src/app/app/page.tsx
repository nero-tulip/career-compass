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
  // Where the primary CTA should go (if quiz, we'll generally use /api/quiz/entry)
  startPath?: string; // optional override for non-quiz modules
  viewPath?: string;  // e.g., results view
  icon?: string;      // simple emoji/icon placeholder
};

const MODULES: ModuleDef[] = [
  {
    key: 'profileBasics',
    title: 'Profile Basics',
    subtitle: 'Let’s get to know you',
    kind: 'quiz',
    tier: 'free',
    icon: '👋',
  },
  {
    key: 'careerPrefs',
    title: 'Career Preferences',
    subtitle: 'What work feels good?',
    kind: 'quiz',
    tier: 'free',
    icon: '🎯',
  },
  {
    key: 'riasec',
    title: 'RIASEC Interests',
    subtitle: 'What energizes you?',
    kind: 'quiz',
    tier: 'free',
    icon: '🧩',
  },
  {
    key: 'results',
    title: 'Your Results (Wrapped)',
    subtitle: 'See matches & insights',
    kind: 'output',
    tier: 'free',
    viewPath: '/app/results', // we’ll plug an actual latest-[rid] route later
    icon: '📊',
  },
  {
    key: 'big5',
    title: 'Big-5 Personality',
    subtitle: 'Go deeper with PRO',
    kind: 'quiz',
    tier: 'pro',
    startPath: '/app/quiz/big5', // placeholder
    icon: '🧠',
  },
  {
    key: 'mentors',
    title: 'Mentor Matches',
    subtitle: 'Guidance from pros',
    kind: 'service',
    tier: 'pro',
    viewPath: '/app/mentors', // placeholder
    icon: '🤝',
  },
  {
    key: 'resources',
    title: 'Resources',
    subtitle: 'Learn & level up',
    kind: 'service',
    tier: 'free',
    viewPath: '/app/resources', // placeholder
    icon: '📚',
  },
];

export default function AppHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);

  async function handleStartOrResume(mod: ModuleDef) {
    if (loading || busyKey) return;
    try {
      setBusyKey(mod.key);

      // For quiz modules that use your existing flow, call /api/quiz/entry
      if (mod.kind === 'quiz' && mod.tier === 'free') {
        if (!user) return router.push('/login?next=/app');
        const token = await user.getIdToken?.();
        const res = await fetch('/api/quiz/entry', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token,
          },
          body: JSON.stringify({}),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        // Use destination from server (works with your current routing).
        // If missing, fallback to current known paths (we'll move them under /app/quiz later).
        const dest =
          data?.destination ||
          (mod.key === 'profileBasics'
            ? '/intake'
            : mod.key === 'careerPrefs'
            ? '/macro'
            : mod.key === 'riasec'
            ? '/riasec'
            : '/intake');
        router.push(dest);
        return;
      }

      // Non-quiz or custom routes:
      const dest = mod.viewPath || mod.startPath || '/app';
      router.push(dest);
    } catch (e) {
      console.error(e);
      alert('Something went wrong. Please try again.');
    } finally {
      setBusyKey(null);
    }
  }

  function handleView(mod: ModuleDef) {
    const dest = mod.viewPath || '/app';
    router.push(dest);
  }

  // TODO: replace with real entitlement check (users/{uid}.entitlement) later
  const isPro = false;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Your CareerCompass</h1>
      <p className="text-gray-700">
        Build your profile, explore insights, and go deeper with PRO.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULES.map((m) => {
          const locked = m.tier === 'pro' && !isPro;
          const busy = busyKey === m.key;
          const primaryCta =
            m.kind === 'quiz'
              ? locked
                ? 'Unlock PRO'
                : 'Start / Continue'
              : locked
              ? 'Unlock PRO'
              : 'View';
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
              // Secondary actions: edit/recompute/etc. can be added later
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
    <div
      className={[
        'rounded-2xl border p-4 bg-white flex flex-col justify-between',
        locked ? 'opacity-90 border-purple-300' : '',
      ].join(' ')}
    >
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
          className={[
            'px-3 py-1.5 rounded-lg text-sm',
            locked ? 'bg-purple-600 text-white' : 'bg-black text-white',
          ].join(' ')}
        >
          {primaryLabel}
        </button>

        {/* Placeholder secondary action slots (e.g., Edit / Recompute) */}
        {/* <button className="px-3 py-1.5 rounded-lg border text-sm">Edit</button> */}
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