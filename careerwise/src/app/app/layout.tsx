// src/app/app/layout.tsx
import { ReactNode } from "react";
import Link from "next/link";
import { AuthProvider } from "@/app/providers/AuthProvider";
import RequireAuth from "@/app/components/RequireAuth";

export const metadata = {
  title: "CareerCompass — App",
};

export default function AppLayout({ children }: { children: ReactNode }) {
  // NOTE:
  // - No <html> or <body> here (only allowed in root layout).
  // - Avoid <main> to prevent <main> inside <main> if your root layout already uses it.
  return (
    <AuthProvider>
      <RequireAuth>
        <div className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="font-semibold">
                CareerCompass
              </Link>
              <nav className="hidden sm:flex items-center gap-4 text-sm text-gray-600">
                <Link href="/app" className="hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/app/quiz/intake" className="hover:text-gray-900">
                  Profile Quiz
                </Link>
                <Link href="/app/pro" className="hover:text-gray-900">
                  PRO
                </Link>
              </nav>
            </div>
            <div className="text-sm">
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Use a div instead of <main> to avoid nesting under root <main> */}
        <div role="main" className="mx-auto max-w-6xl px-4 py-6">
          {children}
        </div>
      </RequireAuth>
    </AuthProvider>
  );
}

function UserMenu() {
  return (
    <div className="flex items-center gap-3">
      <a href="/login" className="hover:underline">
        Log in
      </a>
      <a href="/signup" className="bg-black text-white px-3 py-1.5 rounded-lg">
        Sign up
      </a>
    </div>
  );
}