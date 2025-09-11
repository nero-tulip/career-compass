"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

export default function HeaderNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <nav className="flex items-center gap-3 text-sm">
      <Link href="/quiz" className="btn btn-outline">
        Quiz
      </Link>
      {!loading && !user && (
        <Link href="/signup" className="btn btn-primary">
          Create account
        </Link>
      )}
      {!loading && user && (
        <span className="text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md bg-black/5 dark:bg-white/10">
          {user.email}
        </span>
      )}
    </nav>
  );
}
