"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

export default function StartQuizButton() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const go = () => {
    if (loading) return;
    router.push(user ? "/intake" : "/start");
  };

  return (
    <button onClick={go} disabled={loading} aria-busy={loading} className="btn btn-primary disabled:opacity-50">
      {loading ? "Loading..." : "Start quiz"}
    </button>
  );
}
