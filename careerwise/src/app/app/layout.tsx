"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import RequireAuth from "@/app/components/auth/RequireAuth";
import UserMenuClient from "@/app/components/auth/UserMenuClient";
import { fetchUserEntitlementServer } from "@/app/lib/server/actions";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (!user || loading) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const ent = await fetchUserEntitlementServer(token);
        setIsPro(ent === "pro");
      } catch (err) {
        console.error("Failed to fetch entitlement:", err);
      }
    })();
  }, [user, loading]);

  return (
    
      <RequireAuth>
        {/* Header Nav */}
        <div className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-semibold text-lg tracking-tight">
                Career Compass
              </Link>

              <nav className="flex items-center gap-2">
                <Link
                  href="/app"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Dashboard
                </Link>
                <Link
                  href="/app/account"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Account
                </Link>

                {/* Show only if NOT pro */}
                {!isPro && (
                  <Link
                    href="/app/pro"
                    className="inline-flex items-center px-3 py-1.5 rounded-lg border bg-purple-600 text-sm font-medium text-white hover:opacity-90 transition"
                  >
                    Go PRO
                  </Link>
                )}
              </nav>
            </div>

            {/* Right side */}
            <UserMenuClient />
          </div>
        </div>

        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </RequireAuth>
    
  );
}