"use client";

import React, { useState } from "react";
import { auth } from "@/app/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      router.push("/account");
    } catch (err: unknown) {
      let msg = "Failed to log in";
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : undefined;
      if (code === "auth/invalid-credential") msg = "Invalid email or password";
      else if (code === "auth/user-not-found") msg = "No account found for this email";
      else if (code === "auth/wrong-password") msg = "Incorrect password";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.length > 3 && password.length > 0 && !loading;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card shadow-sm p-8 bg-white/90 dark:bg-white/5 backdrop-blur-sm">
        <h1 className="text-3xl font-semibold tracking-tight mb-6 text-center">Log in</h1>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full form-field"
              required
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full form-field"
              required
            />
          </div>
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mt-6">
          Don&apos;t have an account? {" "}
          <Link href="/signup" className="underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
