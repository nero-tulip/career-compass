"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/app/providers/AuthProvider";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleStart = () => {
    if (loading) return;
    router.push(user ? "/intake" : "/start");
  };

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              Find your work fit.
            </h1>
            <p className="mt-4 text-lg muted max-w-prose">
              Take a sleek, minimal RIASEC-based quiz to understand your strengths
              and discover work environments that suit you.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <button onClick={handleStart} className="btn btn-primary">
                Start the quiz
              </button>
              <a href="#how-it-works" className="btn btn-ghost">
                Learn more
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl border border-[--border] shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] bg-[--surface]" />
          </div>
        </div>
      </div>

      <div id="how-it-works" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6">
            <h3 className="font-medium">Answer thoughtfully</h3>
            <p className="mt-2 text-sm muted">
              Two parts: big-picture values, then a quick interests check.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-medium">See your profile</h3>
            <p className="mt-2 text-sm muted">
              We map your answers to the RIASEC model to show strengths.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="font-medium">Get direction</h3>
            <p className="mt-2 text-sm muted">
              Receive a clean summary and matched roles to explore.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
