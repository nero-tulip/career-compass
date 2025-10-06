// src/app/app/pro/checkout/page.tsx
'use client';

import Link from 'next/link';

export default function ProCheckoutPlaceholder() {
  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
      <h1 className="text-3xl font-semibold">Checkout (coming soon)</h1>
      <p className="text-[--text-dim]">
        We’re adding secure payments. You’ll be able to purchase PRO for a one-time fee of $39
        and get lifetime access to all PRO features.
      </p>
      <div className="space-x-2">
        <Link href="/app/pro" className="btn btn-outline">Back to pricing</Link>
        <Link href="/app" className="btn btn-primary">Return to dashboard</Link>
      </div>
    </div>
  );
}