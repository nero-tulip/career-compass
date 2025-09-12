// src/app/start/page.tsx
"use client";

import { useRouter } from "next/navigation";

export default function StartGatePage() {
  const router = useRouter();
  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-4">
      <div className="card">
        <h1 className="text-xl font-semibold">Create your account</h1>
        <p className="muted">
          We’ll save your progress and results so you can come back anytime and
          see past reports.
        </p>
        <ul className="list-disc pl-6 mt-3 text-sm">
          <li>Save progress across devices</li>
          <li>Personalized results for your country and stage</li>
          <li>View and compare past results</li>
        </ul>
        <div className="mt-4 flex gap-3">
          <button onClick={() => router.push("/signup")} className="btn-primary">
            Create account
          </button>
          <button onClick={() => router.push("/login")} className="btn-ghost">
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
