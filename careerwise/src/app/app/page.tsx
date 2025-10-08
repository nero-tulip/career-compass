// src/app/app/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';

// Firestore (client)
import {
  collection,
  doc,
  getDocs,
  getDoc,
  limit as qLimit,
  orderBy,
  query,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/app/lib/firebase';

// Data lengths for progress math
import intakeConfig from '@/app/data/intakeQuestions.json';
import macroQuestions from '@/app/data/macroQuestions.json';
import riaQuestions from '@/app/data/riasecQuestionsShuffled.json';
import big5Config from '@/app/data/big5Questions.json';

// Totals (used to compute %)
const TOTALS = {
  intake: (intakeConfig as any).questions?.length ?? 0,
  macro:  (macroQuestions as any)?.length ?? 0,
  riasec: (riaQuestions as any)?.length ?? 0,
  big5:   (big5Config as any)?.items?.length ?? 0,
};

// ---------- Types ----------
type ModuleKey =
  | 'profileBasics'   // intake
  | 'careerPrefs'     // macro
  | 'riasec'          // riasec
  | 'results'         // wrapped results
  | 'big5'            // big five
  | 'mentors'         // service
  | 'resources';      // service

type ModuleDef = {
  key: ModuleKey;
  title: string;
  subtitle?: string;
  kind: 'quiz' | 'output' | 'service';
  tier: 'free' | 'pro';
  startPath?: string;
  viewPath?: string;
  icon?: string;
  blurb?: string; // short hover tooltip text
};

type SectionId = 'intake' | 'macro' | 'riasec' | 'big5';
type Progress = { pct: number; label: string };

type DraftDoc = {
  intake?: Record<string, unknown>;
  // For progress we only need lengths; keep these flexible
  macro?: unknown[];
  riasec?: unknown[];
  big5?: unknown[];
  updatedAt?: Timestamp | Date | null;
};

// ---------- Config ----------
const MODULES: ModuleDef[] = [
  {
    key: 'profileBasics',
    title: 'Introduction',
    subtitle: 'Let’s get to know you',
    kind: 'quiz',
    tier: 'free',
    icon: '👋',
    blurb: 'Some basic questions to get to know you: your name, age, where you are, and what you\'re looking for.',
  },
  {
    key: 'careerPrefs',
    title: 'Career Preferences',
    subtitle: 'What kind of career do you have in mind?',
    kind: 'quiz',
    tier: 'free',
    icon: '🎯',
    blurb: 'Let\'s get a better understanding of your macro-career goals and values.',
  },
  {
    key: 'riasec',
    title: 'RIASEC Analysis',
    subtitle: 'What type of work resonates with you?',
    kind: 'quiz',
    tier: 'free',
    icon: '🧩',
    blurb: 'Utilizes Holland’s interests model (R-I-A-S-E-C) and government-collected data to understand the kinds of work activities most aligned to you.',
  },
  {
    key: 'big5',
    title: 'Big-5 Personality',
    subtitle: 'What are your strongest personality traits?',
    kind: 'quiz',
    tier: 'free',
    startPath: '/app/quiz/big5',
    icon: '🧠',
    blurb: 'A thorough psychological assessment providing depth of self-understanding, utilized by trained psychologists for decades.',
  },
  {
    key: 'results',
    title: 'Your Results',
    subtitle: 'See matches & insights',
    kind: 'output',
    tier: 'free',
    viewPath: '/app/results',
    icon: '📊',
    blurb: 'A holistic report that synthesizes all your data into a comprehensive overview.',
  },
  {
    key: 'mentors',
    title: 'Mentor Matches',
    subtitle: 'Guidance from pros',
    kind: 'service',
    tier: 'pro',
    viewPath: '/app/mentors',
    icon: '🤝',
    blurb: 'Find mentors from all over the world to help you achieve your goals.',
  },
  {
    key: 'resources',
    title: 'Resources',
    subtitle: 'Learn & level up',
    kind: 'service',
    tier: 'free',
    viewPath: '/app/resources',
    icon: '📚',
    blurb: 'Tools you\'ll need to get where you want to go.',
  },
];

// ---------- Page ----------
export default function AppHome() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [busyKey, setBusyKey] = useState<ModuleKey | null>(null);

  const [progressBySection, setProgressBySection] = useState<
    Partial<Record<SectionId, Progress>>
  >({
    intake: { pct: 0, label: 'Not started' },
    macro:  { pct: 0, label: 'Not started' },
    riasec: { pct: 0, label: 'Not started' },
    big5:   { pct: 0, label: 'Not started' },
  });

  // ---------- Compute progress helpers ----------
  function percent(numer: number, denom: number) {
    if (!denom) return 0;
    const ratio = numer / denom;
    return Math.max(0, Math.min(100, Math.round(ratio * 100)));
  }

  function computeIntakeProgress(intake: DraftDoc['intake']): Progress {
    const total = TOTALS.intake;
    if (!intake || !total) return { pct: 0, label: 'Not started' };

    const answered = Object.values(intake).filter((v) => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      return v != null;
    }).length;

    const pct = percent(answered, total);
    return { pct, label: pct >= 100 ? 'Completed' : pct > 0 ? 'In progress' : 'Not started' };
  }

  function computeArrayProgress(arr: unknown[] | undefined, total: number): Progress {
    if (!total) return { pct: 0, label: 'Not started' };
    const count = Array.isArray(arr) ? arr.length : 0;
    const pct = percent(count, total);
    return { pct, label: pct >= 100 ? 'Completed' : pct > 0 ? 'In progress' : 'Not started' };
  }


  const [latestRid, setLatestRid] = useState<string | null>(null);

  // ---------- Load latest draft & compute progress ----------
  useEffect(() => {
    if (loading || !user) return;
    

    (async () => {
      try {
        const draftsCol = collection(db, 'users', user.uid, 'drafts');
        const q = query(draftsCol, orderBy('updatedAt', 'desc'), qLimit(1));
        const snap = await getDocs(q);

        if (snap.empty) {
          setProgressBySection({
            intake: { pct: 0, label: 'Not started' },
            macro:  { pct: 0, label: 'Not started' },
            riasec: { pct: 0, label: 'Not started' },
            big5:   { pct: 0, label: 'Not started' },
          });
          return;
        }
        
        
        const latest = snap.docs[0];
        setLatestRid(latest.id);
        const draftRef = doc(db, 'users', user.uid, 'drafts', latest.id);
        const draftSnap = await getDoc(draftRef);
        const draft = (draftSnap.data() || {}) as DraftDoc;

        const intake = computeIntakeProgress(draft.intake);
        const macro  = computeArrayProgress(draft.macro,  TOTALS.macro);
        const riasec = computeArrayProgress(draft.riasec, TOTALS.riasec);
        const big5   = computeArrayProgress(draft.big5,   TOTALS.big5);

        setProgressBySection({ intake, macro, riasec, big5 });
      } catch (e) {
        // fail-soft: keep defaults
        console.error('Failed to load draft progress', e);
      }
    })();
  }, [user, loading]);

  const progressForModule: Record<ModuleKey, Progress | undefined> = useMemo(
    () => ({
      profileBasics: progressBySection.intake,
      careerPrefs:   progressBySection.macro,
      riasec:        progressBySection.riasec,
      big5:          progressBySection.big5,
      results:       undefined,
      mentors:       undefined,
      resources:     undefined,
    }),
    [progressBySection]
  );

  async function handleStartOrResume(mod: ModuleDef) {
    if (loading || busyKey) return;
    try {
      setBusyKey(mod.key);
      if (!user) return router.push('/login?next=/app');

      if (mod.kind === 'quiz') {
        const token = await user.getIdToken?.();

        // Map dashboard card -> section param for API
        const section =
          mod.key === 'profileBasics' ? 'intake' :
          mod.key === 'careerPrefs'   ? 'macro'  :
          mod.key === 'riasec'        ? 'riasec' :
          mod.key === 'big5'          ? 'big5'   : 'app';

        const res = await fetch('/api/quiz/entry', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
          body: JSON.stringify({ section }),
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();

        // Prefer server-provided destination; fall back to module's startPath or section path
        const dest = data?.destination || (mod.startPath ?? `/app/quiz/${section}`);
        router.push(dest);
        return;
      }

      // Non-quiz / custom
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

  // Grouped sections
  const quizzes = MODULES.filter((m) => m.kind === 'quiz');
  const results = MODULES.filter((m) => m.key === 'results');
  const services = MODULES.filter((m) => m.kind === 'service');

  return (
    <section className="space-y-10">
      <header>
        <h1 className="text-2xl font-semibold">Your CareerCompass</h1>
        <p className="text-gray-700">Build your profile, explore insights, and go deeper with PRO.</p>
      </header>

      {/* Quizzes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-gray-600 uppercase">Analysis</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map((m) => {
            const locked = m.tier === 'pro' && !isPro;
            const busy = busyKey === m.key;
            const pct = progressForModule[m.key]?.pct ?? 0;
            const primaryCta = locked ? 'Unlock PRO' : (pct>= 100 ? 'Review' : pct > 0 ? 'Continue' : 'Start');
            const onPrimary = locked
              ? () => router.push('/app/pro')
              : () => handleStartOrResume(m);

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
                progress={progressForModule[m.key]}
                blurb={m.blurb}
                onSecondary={
                  // Only show for completed RIASEC / Big5
                  progressForModule[m.key]?.label === 'Completed' &&
                  (m.key === 'riasec' || m.key === 'big5') && latestRid
                    ? () => router.push(`/app/results/${m.key}?rid=${latestRid}`)
                    : undefined
                }
                secondaryLabel="View Results"
              />  
            );
          })}
        </div>
      </div>

      {/* Results (standalone) */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-gray-600 uppercase">Results</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((m) => {
            const locked = m.tier === 'pro' && !isPro;
            const busy = busyKey === m.key;
            const onPrimary = locked
              ? () => router.push('/app/pro')
              : () => handleView(m);
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
                primaryLabel={busy ? 'Loading…' : 'View'}
                blurb={m.blurb}
              />
            );
          })}
        </div>
      </div>

      {/* Services */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold tracking-wide text-gray-600 uppercase">Services</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((m) => {
            const locked = m.tier === 'pro' && !isPro;
            const busy = busyKey === m.key;
            const primaryCta = locked ? 'Unlock PRO' : 'Explore';
            const onPrimary = locked
              ? () => router.push('/app/pro')
              : () => handleView(m);

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
                blurb={m.blurb}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ---------- UI ----------
function ModuleCard(props: {
  title: string;
  subtitle?: string;
  icon?: string;
  tier: 'free' | 'pro';
  locked?: boolean;
  busy?: boolean;
  primaryLabel: string;
  onPrimary: () => void;
  progress?: Progress;
  blurb?: string;
  secondaryLabel?: string;
  onSecondary?: (() => void) | undefined;
}) {
  const {
    title, subtitle, icon, tier, locked, busy, primaryLabel, onPrimary, progress, blurb
  } = props;

  return (
    <div className="group relative rounded-2xl border p-4 bg-white flex flex-col justify-between transition-all hover:shadow-[var(--shadow-2)] hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 grid place-items-center text-lg">{icon ?? '🧭'}</div>
          <div>
            <div className="font-semibold">{title}</div>
            {subtitle ? <div className="text-xs text-gray-600">{subtitle}</div> : null}
          </div>
        </div>
        {/* Only show PRO badge; Free badge removed */}
        {tier === 'pro' ? <ProBadge locked={!!locked} /> : null}
      </div>

      {/* Progress (optional) */}
      {typeof progress?.pct === 'number' ? (
        <div className="mt-4">
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${Math.max(0, Math.min(100, progress.pct))}%`,
                background: locked
                  ? 'linear-gradient(90deg,#a78bfa,#f472b6)'
                  : 'linear-gradient(90deg,#22d3ee,#a855f7)',
              }}
            />
          </div>
          <div className="mt-1 text-[11px] text-gray-500">
            {locked ? 'Locked' : (progress.label ?? `${progress.pct}% complete`)}
          </div>
        </div>
      ) : (
        <div className="mt-4 h-2" />
      )}

      <div className="mt-4 flex items-center gap-2">
        <button
          onClick={onPrimary}
          disabled={busy}
          className={[
            'px-3 py-1.5 rounded-lg text-sm cursor-pointer',
            locked ? 'bg-purple-600 text-white' : 'bg-black text-white',
            'hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black/10',
          ].join(' ')}
        >
          {primaryLabel}
        </button>

        {props.onSecondary ? (
          <button
            onClick={props.onSecondary}
            disabled={busy}
            className="px-3 py-1.5 rounded-lg cursor-pointer text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            {props.secondaryLabel}
          </button>
        ) : null}
      </div>

      {/* Hover tooltip */}
      {blurb ? (
        <div
          className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full opacity-0 group-hover:opacity-100 transition
                     w-[min(92vw,28rem)]"
        >
          <div className="rounded-xl border bg-white shadow-md p-3 text-xs text-gray-700">
            {blurb}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ProBadge({ locked }: { locked: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
      {locked ? '🔒' : '⭐️'} PRO
    </span>
  );
}