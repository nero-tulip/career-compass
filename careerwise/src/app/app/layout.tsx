import { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider } from "@/app/providers/AuthProvider";
import RequireAuth from "@/app/components/auth/RequireAuth";
import UserMenuClient from "@/app/components/auth/UserMenuClient";

export const metadata = {
  title: "CareerCompass — App",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RequireAuth>
        {/* Top Nav */}
        <div className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            {/* Left side: brand + nav */}
            <div className="flex items-center gap-4">
              {/* Logo / Home */}
              <Link href="/" className="font-semibold text-lg tracking-tight">
                CareerCompass
              </Link>

              {/* Nav buttons */}
              <nav className="flex items-center gap-2">
                <Link
                  href="/app"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
                >
                  Dashboard
                </Link>

                <Link
                  href="/app/pro"
                  className="inline-flex items-center px-3 py-1.5 rounded-lg bg-black text-white text-sm font-medium hover:opacity-90 transition"
                >
                  Go PRO
                </Link>
              </nav>
            </div>

            {/* Right side: user menu */}
            <div className="text-sm">
              <UserMenuClient />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      </RequireAuth>
    </AuthProvider>
  );
}