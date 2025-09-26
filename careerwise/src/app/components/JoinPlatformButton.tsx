'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function JoinPlatformButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function go() {
    try {
      setChecking(true);
      const token = (window as any).__ID_TOKEN__ || (await (window as any).getIdToken?.());
      if (token) router.push('/app');
      else router.push('/signup?next=/app');
    } finally {
      setChecking(false);
    }
  }

  return (
    <button onClick={go} className={`px-4 py-2 rounded-lg bg-black text-white ${className}`}>
      {checking ? 'One sec…' : 'Join the Platform'}
    </button>
  );
}