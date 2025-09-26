// src/app/components/JoinPlatformButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/app/providers/AuthProvider"; // <-- use your provider

type Props = {
  label?: string;
  className?: string;
  nextPath?: string; // optional override (defaults to /app)
};

export default function JoinPlatformButton({
  label = "Let's Get Started",
  className = "btn btn-primary",
  nextPath = "/app",
}: Props) {
  const router = useRouter();
  const { user, loading } = useAuth();           // <— reliable source of truth
  const [busy, setBusy] = useState(false);

  async function go() {
    if (loading || busy) return;
    try {
      setBusy(true);

      if (user) {
        // Optional: warm up an ID token for subsequent API calls.
        // Not required for navigation, but handy if your dashboard fetches immediately.
        try { await user.getIdToken?.(); } catch {}

        router.push(nextPath);
      } else {
        router.push(`/signup?next=${encodeURIComponent(nextPath)}`);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button onClick={go} disabled={loading || busy} className={className}>
      {loading || busy ? "One sec…" : label}
    </button>
  );
}