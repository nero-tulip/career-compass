"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/app/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";

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

  const handleQuizClick = () => {
    if (loading) return;
    router.push(user ? "/intake" : "/start");
  };

  return (
    <nav className="flex items-center gap-3 text-sm">
      <button onClick={handleQuizClick} className="btn btn-outline">
        Quiz
      </button>
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
          className="btn btn-primary"
        >
          Account
        </button>
      )}
    </nav>
  );
}
