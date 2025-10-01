"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import StartQuizButton from "./StartQuizButton";
import JoinPlatformButton from "./JoinPlatformButton";
import UserMenuClient from "./auth/UserMenuClient";

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
      <JoinPlatformButton 
      label="The Platform"
      />
      {!loading && !user && (
        <button
          onClick={() => router.push("/login")}
          className="btn btn-ghost"
        >
          Log in
        </button>
      )}
      {!loading && user && (
        <UserMenuClient />
      )}
    </nav>
  );
}
