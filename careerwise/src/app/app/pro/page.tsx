// src/app/app/pro/page.tsx
'use client';

import Link from 'next/link';
import { useAuth } from '@/app/providers/AuthProvider';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const FEATURES = [
  'Lifetime access (one-time payment)',
  'Full Big-5 deep dive interpretations',
  'Advanced matching (coming soon)',
  'Mentor matches (PRO)',
  'Priority feature access & updates',
  'All future PRO features included',
];

const FAQ = [
  {
    q: 'Is this really a one-time fee?',
    a: 'Yes. Pay once, get lifetime access to all current and future PRO features. No subscriptions.'
  },
  {
    q: 'Will the price increase later?',
    a: 'Likely, yes. We keep shipping new features, and lifetime pricing typically increases over time.'
  },
  {
    q: 'What if I’m not satisfied?',
    a: 'We want you to be happy. If you feel PRO was not valuable, contact us within 14 days for a full refund.'
  },
  {
    q: 'Do I lose access if I switch devices?',
    a: 'No. Your PRO status is tied to your account, not your device.'
  },
];

export default function ProPage() {
  const { user } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get('from') || '';

  useEffect(() => {
    // (Optional) basic analytics stub
    // window.posthog?.capture('view_pro_pricing', { from });
  }, [from]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center space-y-3">
        <div className="inline-block rounded-full border px-3 py-1 text-xs text-gray-600">Lifetime Deal</div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">Go <span className="text-gradient">PRO</span> — for life</h1>
        <p className="text-[--text-dim] max-w-2xl mx-auto">
          A one-time fee of <strong>$39</strong> for lifetime access. We keep shipping features; your price never changes.
        </p>
      </header>

      <section className="mt-8 grid md:grid-cols-[1.2fr_.8fr] gap-6 items-start">
        {/* Left: value & features */}
        <div className="rounded-2xl border bg-white p-6 space-y-6">
          <h2 className="text-xl font-semibold">Everything in PRO</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1">✅</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-[--surface] p-4 text-sm text-gray-700">
            <div className="font-medium mb-1">Why now?</div>
            <p>
              We’re continuously adding features (advanced matching, richer reports, more mentor capacity).
              This price is likely the lowest it’ll ever be. Lock in lifetime access today.
            </p>
          </div>
        </div>

        {/* Right: pricing card */}
        <div className="rounded-2xl border bg-white p-6 sticky top-4">
          <div className="text-sm text-gray-600">Lifetime Access</div>
          <div className="mt-1 text-4xl font-bold">$39</div>
          <div className="text-xs text-gray-600">one-time payment</div>

          <div className="mt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2"><span>•</span> No subscription</div>
            <div className="flex items-center gap-2"><span>•</span> All future PRO features</div>
            <div className="flex items-center gap-2"><span>•</span> 14-day refund policy</div>
          </div>

          <Link
            href={`/app/pro/checkout${from ? `?from=${encodeURIComponent(from)}` : ''}`}
            className="mt-6 block w-full text-center btn btn-primary"
            onClick={() => {
              // window.posthog?.capture('click_pro_cta', { from });
            }}
          >
            Get lifetime access — $39
          </Link>

          {!user ? (
            <p className="text-xs text-gray-600 mt-3 text-center">
              You’ll be asked to log in or create a free account.
            </p>
          ) : (
            <p className="text-xs text-gray-600 mt-3 text-center">
              Signed in as <span className="font-medium">{user.email}</span>
            </p>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">Frequently asked questions</h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details key={q} className="rounded-xl border bg-white p-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm text-gray-700">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-gray-500">
        Secure checkout. You’ll receive a receipt and PRO is applied to your account automatically after payment.
      </footer>
    </div>
  );
}