// src/app/app/account/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

type Entitlement = "free" | "pro" | string;

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entitlement, setEntitlement] = useState<Entitlement | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(false);

  // Observe auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load entitlement from users/{uid}
  useEffect(() => {
    if (!user) return;
    setEntitlementLoading(true);
    (async () => {
      try {
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        setEntitlement((snap.data()?.entitlement as Entitlement) || "free");
      } catch {
        setEntitlement("free");
      } finally {
        setEntitlementLoading(false);
      }
    })();
  }, [user]);

  const handleSignOut = async () => {
    setError(null);
    try {
      await signOut(auth);
      router.push("/");
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e !== null && "message" in e
          ? String((e as { message?: unknown }).message)
          : undefined;
      setError(message ?? "Failed to sign out");
    }
  };

  const joined = useMemo(
    () =>
      user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleString()
        : "—",
    [user]
  );
  const lastSignIn = useMemo(
    () =>
      user?.metadata?.lastSignInTime
        ? new Date(user.metadata.lastSignInTime).toLocaleString()
        : "—",
    [user]
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="h-44 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
          <div className="h-44 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
          <div className="h-44 rounded-2xl bg-black/5 dark:bg-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <div className="surface p-6">
          <h1 className="text-2xl font-semibold mb-2">You’re not signed in</h1>
          <p className="muted mb-4">
            To view your account details, please create an account or log in.
          </p>
          <div className="flex gap-3">
            <Link href="/signup" className="btn btn-primary">
              Create account
            </Link>
            <Link href="/login" className="btn btn-outline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Initials avatar
  const initials =
    (user.displayName?.match(/\b\w/g)?.slice(0, 2).join("") ||
      user.email?.[0] ||
      "U"
    ).toUpperCase();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/20 grid place-items-center text-xl font-bold text-primary">
            {initials}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">Your account</h1>
            <p className="muted">Manage your details and membership.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSignOut} className="btn btn-outline">
            Sign out
          </button>
        </div>
      </header>

      {error ? (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
          {error}
        </div>
      ) : null}

      {/* Grid */}
      <section className="grid gap-6 md:grid-cols-3">
        {/* Membership */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Membership</h2>
            <span
              className={[
                "badge",
                entitlement === "pro" ? "!bg-purple-600 !border-purple-800 !text-white" : "",
              ].join(" ")}
            >
              {entitlementLoading ? "…" : entitlement?.toUpperCase() || "FREE"}
            </span>
          </div>

          {entitlement === "pro" ? (
            <p className="mt-3 text-sm">
              🎉 Thanks for being a <strong>PRO</strong> member! You have
              lifetime access to current & future features.
            </p>
          ) : (
            <div className="mt-3 space-y-3 text-sm">
              <p>
                You’re on the <strong>Free</strong> plan. Upgrade once, get
                lifetime access — no subscriptions.
              </p>
              <Link href="/app/pro" className="btn btn-primary w-full">
                Upgrade to PRO
              </Link>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold">Profile</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <span className="muted">Email</span>
              <span className="font-medium break-all text-right">
                {user.email ?? "—"}
              </span>
            </div>
            <div className="flex items-start justify-between">
              <span className="muted">User ID</span>
              <span className="font-mono text-xs break-all text-right">{user.uid}</span>
            </div>
          </div>
        </div>

        {/* Security & Activity */}
        <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-lg font-semibold">Activity</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start justify-between">
              <span className="muted">Joined</span>
              <span className="font-medium">{joined}</span>
            </div>
            <div className="flex items-start justify-between">
              <span className="muted">Last sign-in</span>
              <span className="font-medium">{lastSignIn}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Danger zone */}
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-lg font-semibold">Danger zone</h2>
        <p className="muted text-sm mt-1">
          These actions are permanent. We’ll add confirmations when wired.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="w-full btn btn-outline"
            onClick={() => alert("Delete my data: TODO — to be wired")}
          >
            Delete all my data
          </button>
          <button
            type="button"
            className="w-full btn btn-outline"
            onClick={() => alert("Delete my account: TODO — to be wired")}
          >
            Delete my account
          </button>
        </div>
      </section>
    </div>
  );
}