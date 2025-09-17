"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";
import { getIdToken } from "firebase/auth";
import { useState } from "react";

export default function StartQuizButton() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (loading || busy) return;
    setBusy(true);
    try {
      if (!user) {
        router.push("/start");
        return;
      }
      const idToken = await getIdToken(user, false);

      const res = await fetch("/api/quiz/entry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok || !data?.destination) {
        router.push("/start");
        return;
      }
      router.push(data.destination as string);
    } catch (err) {
      console.error("[StartQuizButton] entry error:", err);
      router.push("/start");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={go}
      disabled={loading || busy}
      className="btn btn-primary"
    >
      {busy ? "Loading…" : "Start Questionnaire"}
    </button>
  );
}
