"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import StartQuizButton from "./StartQuizButton";

export default function HeaderNav() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return (
    <nav className="flex items-center gap-3 text-sm">
      <StartQuizButton />
      {!loading && !user && (
        <button
          onClick={() => router.push("/signup")}
          className="btn btn-primary"
        >
          Create account
        </button>
      )}
      {!loading && user && (
        <button
          onClick={() => router.push("/account")}
          className="btn btn-ghost"
        >
          Account
        </button>
      )}
    </nav>
  );
}
