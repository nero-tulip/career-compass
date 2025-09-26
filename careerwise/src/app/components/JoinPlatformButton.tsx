// src/app/components/JoinPlatformButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  label?: string;
  className?: string;
};

export default function JoinPlatformButton({
  label = "Let's Get Started",
}: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(false);

  async function go() {
    try {
      setChecking(true);
      const token =
        (window as any).__ID_TOKEN__ || (await (window as any).getIdToken?.());
      if (token) router.push("/app");
      else router.push("/signup?next=/app");
    } finally {
      setChecking(false);
    }
  }

  return (
    <button
      onClick={go}
      className={`btn btn-primary`}
    >
      {checking ? "One sec…" : label}
    </button>
  );
}