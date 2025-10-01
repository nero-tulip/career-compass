"use client";

import React, { useState } from "react";
import { auth } from "@/app/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
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
  await createUserWithEmailAndPassword(auth, email.trim(), password);
  router.push("/");
    } catch (err: unknown) {
      let msg = "Failed to create account";
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code)
          : undefined;
      if (code === "auth/weak-password") msg = "Password should be at least 6 characters";
      else if (code === "auth/email-already-in-use") msg = "Email already in use";
      else if (code === "auth/invalid-email") msg = "Invalid email";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = email.length > 5 && password.length >= 6 && !loading;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md card shadow-sm p-8 bg-white/90 dark:bg-white/5 backdrop-blur-sm">
        <h1 className="text-3xl font-semibold tracking-tight mb-6 text-center">Create your account</h1>
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full form-field"
            required
            minLength={6}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">At least 6 characters.</p>
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
          {loading ? "Creating..." : "Create account"}
        </button>
        </form>
        <p className="text-sm text-center text-gray-900 dark:text-gray-600 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
