"use client";

import StartQuizButton from "@/app/components/StartQuizButton";
import Image from "next/image";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      {/* background textures */}
      <div aria-hidden className="bg-hero absolute inset-0" />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.06] pointer-events-none" />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24 md:pt-36 pb-20">
        {/* gradient blobs */}
        <div aria-hidden className="hero-blob hero-blob--mint" />
        <div aria-hidden className="hero-blob hero-blob--sky" />
        <div aria-hidden className="hero-blob hero-blob--blush" />

        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] items-start">
          <div>
            <h1 className="text-balance text-4xl md:text-6xl font-semibold tracking-tight leading-tight glow">
              Finding the perfect career, <span className="text-gradient">for you</span>.
            </h1>
            <p className="mt-6 text-lg text-[--text-dim] max-w-prose">
              We combine research-based psychology with job-market insight to help you find environments
              where you’ll thrive.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <StartQuizButton />
              <a href="#how-it-works" className="btn btn-ghost">How it works</a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[--text-dim]">
              <span className="badge">Psychological</span>
              <span className="badge">Save progress</span>
              <span className="badge">Evidence-based</span>
            </div>
          </div>

          <div className="relative min-h-[280px] md:min-h-[420px]">
            {/* abstract “diagram” without borders */}
            <div className="absolute inset-0 rounded-2xl backdrop-blur-md shadow-[var(--shadow-2)] bg-[color:rgba(255,255,255,0.55)]"></div>
            <div className="absolute inset-0 rounded-2xl bg-grid mix-blend-overlay opacity-[0.35]" />
            {/* image inside the square */}
            <div className="absolute inset-0 p-4 md:p-6">
              <div className="relative w-full h-full overflow-hidden rounded-xl">
                <Image
                  src="/hero-illustration.jpg"
                  alt="Career search illustration"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM → SOLUTION (no boxes, just type + soft divider) */}
      <section className="relative mx-auto max-w-5xl px-4 py-16">
        <div className="soft-divider mb-10" />
        <div className="space-y-10">
          <div>
            <h2 className="text-2xl md:text-5xl font-semibold">The problem</h2>
            <ul className="mt-4 space-y-3 leading-relaxed text-[--text] text-lg md:text-xl">
              <li><span className="underline-accent">Lack of self-awareness</span>: few people have a clear, psychological understanding of <span className="underline-accent">who they are</span>.</li>
              <li><span className="underline-accent-green">Lack of job-market knowledge</span>: even fewer people know what roles and paths are available or <span className="underline-accent-green">how to pursue them</span>.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-2xl md:text-5xl font-semibold">Our approach</h2>
            <p className="mt-4 text-[--text-dim]">
              CareerCompass closes both gaps with a clean, rigorous flow:
            </p>
            <ul className="mt-4 space-y-3 leading-relaxed text-[--text]">
              <li>Personal context → map your stage of life and location.</li>
              <li>Values & interests (RIASEC + macro) → your work style, not buzzwords.</li>
              <li>Clear matches and next steps → understand environments where you’ll thrive.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS (timeline, no cards) */}
      <section id="how-it-works" className="relative mx-auto max-w-5xl px-4 py-20">
        <h2 className="text-center text-3xl font-semibold">How it works</h2>
        <ol className="mt-10 relative">
          <div aria-hidden className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08),transparent)]" />
          <li className="timeline-step">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="font-medium">Tell us about you</h3>
              <p className="muted mt-1">A few quick questions to set context — name, country, stage.</p>
            </div>
          </li>
          <li className="timeline-step">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="font-medium">Answer thoughtfully</h3>
              <p className="muted mt-1">Values and interests using research-backed questionnaires.</p>
            </div>
          </li>
          <li className="timeline-step">
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="font-medium">See your profile</h3>
              <p className="muted mt-1">A clear snapshot, tailored matches, and practical next steps.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* TESTIMONIALS (flowing quotes) */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <h2 className="text-center text-3xl font-semibold">What people are saying</h2>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <blockquote className="quote">
            “Gave me language for strengths I could never explain. My interviews changed overnight.”
            <cite>— Placeholder Name</cite>
          </blockquote>
          <blockquote className="quote">
            “Shockingly accurate without being boxy or cringe. I stopped chasing jobs that weren’t me.”
            <cite>— Placeholder Name</cite>
          </blockquote>
          <blockquote className="quote">
            “The report felt like a compass, not a horoscope. Clear, grounded, and usable.”
            <cite>— Placeholder Name</cite>
          </blockquote>
        </div>
      </section>

      {/* FINAL CTA (glass, no borders) */}
      <section className="relative px-4 pb-24">
        <div className="mx-auto max-w-5xl rounded-2xl backdrop-blur-md shadow-[var(--shadow-2)] bg-[color:rgba(255,255,255,0.6)] p-10 text-center">
          <h2 className="text-3xl font-semibold">Ready to find your fit?</h2>
          <p className="muted mt-2">Start now and get a research-based snapshot of where you’ll thrive.</p>
          <div className="mt-6 flex justify-center">
            <StartQuizButton />
          </div>
        </div>
      </section>
    </main>
  );
}
