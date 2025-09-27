// src/app/components/auth/RequireAuth.tsx
"use client";

import { useAuth } from "@/app/providers/AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      const next = encodeURIComponent(pathname);
      router.push(`/login?next=${next}`);
    }
  }, [user, loading, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-gray-500">
        Checking login…
      </div>
    );
  }

  if (!user) {
    // Redirect happening, show nothing
    return null;
  }

  return <>{children}</>;
}