'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/providers/AuthProvider';
import { db } from '@/app/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function ProSuccessPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const sessionId = sp.get('session_id') || '';
  const { user, loading } = useAuth();

  const [entitlement, setEntitlement] = useState<'unknown' | 'pro' | 'free'>('unknown');

  // Watch the user doc so we flip to PRO the moment the webhook writes it
  useEffect(() => {
    if (loading || !user) return;

    // Force-refresh the ID token (not strictly required, but nice if you later move entitlement into custom claims)
    user.getIdToken?.(true).catch(() => { /* ignore */ });

    const ref = doc(db, 'users', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const ent = (snap.data()?.entitlement as string | undefined) || 'free';
      setEntitlement(ent === 'pro' ? 'pro' : 'free');
    });

    return () => unsub();
  }, [loading, user]);

  const title = useMemo(() => {
    if (loading || entitlement === 'unknown') return 'Verifying your purchase…';
    if (entitlement === 'pro') return 'You’re PRO — for life 🎉';
    return 'Payment received — finishing up…';
  }, [loading, entitlement]);

  const sub = useMemo(() => {
    if (loading || entitlement === 'unknown') {
      return 'Hang tight for a moment while we confirm your payment.';
    }
    if (entitlement === 'pro') {
      return 'Your account is upgraded. Enjoy lifetime access to current and future PRO features.';
    }
    return 'If this takes more than a few seconds, try the button below.';
  }, [loading, entitlement]);

  const goHome = () => router.push('/app');

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      {/* Badge */}
      <div className="inline-flex items-center gap-2 rounded-full ring-1 ring-black/10 px-3 py-1 text-xs text-gray-600 bg-white/80 backdrop-blur-sm">
        Checkout complete
      </div>

      <h1 className="mt-4 text-2xl md:text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-[--text-dim]">{sub}</p>

      {/* Session id (handy for support) */}
      {sessionId ? (
        <p className="mt-3 text-xs text-gray-500">
          Ref: <code className="px-1.5 py-0.5 rounded bg-[--primary-ghost]">{sessionId}</code>
        </p>
      ) : null}

      {/* State-specific CTAs */}
      <div className="mt-8 flex flex-col gap-2 items-center">
        {entitlement === 'pro' ? (
          <button className="btn btn-primary w-full" onClick={goHome}>
            Go to dashboard
          </button>
        ) : (
          <>
            <button
              className="btn btn-primary w-full"
              onClick={() => {
                // Manual nudge: refresh token and re-check Firestore quickly
                user?.getIdToken?.(true).finally(() => {
                  // soft reload
                  router.refresh();
                });
              }}
            >
              Refresh status
            </button>
            <button className="btn btn-ghost w-full" onClick={goHome}>
              Return to dashboard
            </button>
          </>
        )}
      </div>

      {/* Tiny helper text */}
      <p className="mt-6 text-xs text-gray-500">
        If your upgrade doesn’t appear within a minute, contact support and include your reference above.
      </p>
    </div>
  );
}