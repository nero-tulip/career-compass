"use client";

import JoinPlatformButton from "../components/JoinPlatformButton";
import Image from "next/image";
import { useEffect, useRef, useState, ElementType, PropsWithChildren } from "react";

/** ----------------------------------------------------------
 * Tiny reveal-on-scroll helper (no external deps)
 * direction: 'up' | 'down' | 'left' | 'right'
 * delay: seconds (stagger siblings like 0, 0.1, 0.2…)
 * as: polymorphic element, defaults to 'div'
 * --------------------------------------------------------- */
function Reveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  as,
}: PropsWithChildren<{
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  as?: ElementType;
}>) {
  const Tag = (as || "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true);
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const base = "transition-all duration-700 ease-out will-change-transform";
  const initial =
    direction === "up"
      ? "translate-y-6"
      : direction === "down"
      ? "-translate-y-6"
      : direction === "left"
      ? "translate-x-6"
      : " -translate-x-6";

  const cls = [
    base,
    shown ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${initial}`,
    className,
  ].join(" ");

  return (
    <Tag
      ref={ref as any}
      className={cls}
      style={{ transitionDelay: `${delay}s` }}
    >
      {children}
    </Tag>
  );
}

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* background textures */}
      <div aria-hidden className="bg-hero absolute inset-0" />
      <div aria-hidden className="bg-noise absolute inset-0 opacity-[0.06] pointer-events-none" />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24 md:pt-36 pb-20">
        {/* gradient blobs */}
        <div aria-hidden className="hero-blob hero-blob--mint" />
        <div aria-hidden className="hero-blob hero-blob--sky" />
        <div aria-hidden className="hero-blob hero-blob--blush" />

        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
          <Reveal as="div" direction="up" delay={0.05}>
            <h1 className="text-balance text-4xl md:text-6xl font-semibold tracking-tight leading-tight glow">
              Finding the perfect career, <span className="text-gradient">for you</span>.
            </h1>
            <Reveal as="p" className="mt-6 text-lg text-[--text-dim] max-w-prose" delay={0.15}>
              We combine research-based psychology with job-market insight to help you find
              environments where you’ll thrive.
            </Reveal>

            <Reveal as="div" className="mt-8 flex flex-wrap items-center gap-4" delay={0.25}>
              <JoinPlatformButton />
              <a href="#how-it-works" className="btn btn-ghost">How it works</a>
            </Reveal>

            <Reveal as="div" className="mt-6 flex flex-wrap gap-3 text-sm text-[--text-dim]" delay={0.35}>
              <span className="badge">Psychological</span>
              <span className="badge">Save progress</span>
              <span className="badge">Evidence-based</span>
            </Reveal>
          </Reveal>

          {/* image column — no white box, aligned with text, larger */}
          <Reveal as="div" className="relative min-h-[420px] md:min-h-[620px]" direction="left" delay={0.15}>
            <Image
              src="/hero-illustration.png"
              alt="Career search illustration"
              fill
              className="object-cover"
              priority
            />
          </Reveal>
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal as="h2" className="text-3xl md:text-5xl font-semibold mb-8" delay={0.05}>
          The problem
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.05}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Problem #1</div>
            <p className="text-lg leading-relaxed">
              <span className="underline-accent">Lack of self-awareness</span>: few people have a clear,
              psychological understanding of <span className="underline-accent">who they are</span>.
            </p>
          </Reveal>

          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.15}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Problem #2</div>
            <p className="text-lg leading-relaxed">
              <span className="underline-accent-green">Lack of job-market knowledge</span>: even fewer people
              know what roles and paths are available or <span className="underline-accent-green">how to pursue them</span>.
            </p>
          </Reveal>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <Reveal as="h2" className="text-3xl md:text-5xl font-semibold mb-8" delay={0.05}>
          Our approach
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.05}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Step 1</div>
            <h3 className="font-medium mb-2">Personal context</h3>
            <p className="text-[15px] text-[--text-dim]">
              Map your stage of life and location so guidance fits your reality.
            </p>
          </Reveal>

          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.15}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Step 2</div>
            <h3 className="font-medium mb-2">Values & interests</h3>
            <p className="text-[15px] text-[--text-dim]">
              Research-backed questionnaires (RIASEC + macro) to understand your work style — not buzzwords.
            </p>
          </Reveal>

          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.25}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">Step 3</div>
            <h3 className="font-medium mb-2">Matches & next steps</h3>
            <p className="text-[15px] text-[--text-dim]">
              Clear career environments where you’ll thrive, with practical actions to move forward.
            </p>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS (timeline, no cards) */}
      <section id="how-it-works" className="relative mx-auto max-w-5xl px-4 py-20">
        <Reveal as="h2" className="text-center text-3xl font-semibold" delay={0.05}>
          How it works
        </Reveal>
        <ol className="mt-10 relative">
          <div aria-hidden className="absolute left-4 md:left-1/2 md:-translate-x-1/2 top-0 bottom-0 w-px bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.08),transparent)]" />
          <Reveal as="li" className="timeline-step" delay={0.05}>
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="font-medium">Tell us about you</h3>
              <p className="muted mt-1">A few quick questions to set context — name, country, stage.</p>
            </div>
          </Reveal>
          <Reveal as="li" className="timeline-step" delay={0.15}>
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="font-medium">Answer thoughtfully</h3>
              <p className="muted mt-1">Values and interests using research-backed questionnaires.</p>
            </div>
          </Reveal>
          <Reveal as="li" className="timeline-step" delay={0.25}>
            <span className="timeline-dot" />
            <div className="timeline-content">
              <h3 className="font-medium">See your profile</h3>
              <p className="muted mt-1">A clear snapshot, tailored matches, and practical next steps.</p>
            </div>
          </Reveal>
        </ol>
      </section>

      {/* TESTIMONIALS (flowing quotes) */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal as="h2" className="text-center text-3xl font-semibold" delay={0.05}>
          What people are saying
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <Reveal className="quote" delay={0.05}>
            “Told me things about myself I didn't even know. Super insightful. No one in school or uni ever focused on these things.”
            <cite>— Annie, 22 (Sydney, Aus)</cite>
          </Reveal>
          <Reveal className="quote" delay={0.15}>
            “So much better than what was offered in school in terms of guidance. The increased self-awareness alone was incredibly helpful.”
            <cite>— James, 20 (London, UK)</cite>
          </Reveal>
          <Reveal className="quote" delay={0.25}>
            “Helped me feel more confident in the uni degree I chose. I now feel like I have a plan with a goal and I know how to get there.”
            <cite>— Sarah, 19 (Melbourne, Aus)</cite>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA (glass, no borders) */}
      <section className="relative px-4 pb-8">
        <Reveal
          className="mx-auto max-w-5xl rounded-2xl backdrop-blur-md shadow-[var(--shadow-2)] bg-[color:rgba(255,255,255,0.6)] p-10 text-center"
          delay={0.05}
        >
          <h2 className="text-3xl font-semibold">Ready to find your fit?</h2>
          <p className="muted mt-2">Start now and get a research-based snapshot of where you’ll thrive.</p>
          <div className="mt-6 flex justify-center">
            <JoinPlatformButton />
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="relative mx-auto max-w-5xl px-4 pb-24">
        <Reveal as="h2" className="text-2xl md:text-3xl font-semibold mb-6 text-center" delay={0.05}>
          Frequently asked questions
        </Reveal>
        <div className="space-y-3">
          <Reveal
            as="details"
            className="group rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-5 shadow-[var(--shadow-1)]"
            delay={0.05}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="font-medium">What is CareerCompass?</span>
              <span className="ml-4 text-gray-500 transition group-open:rotate-45">＋</span>
            </summary>
            <div className="mt-3 text-[15px] text-[--text-dim]">
              A research-based platform that maps your interests and preferences to career environments where you’re most likely to thrive.
            </div>
          </Reveal>

          <Reveal
            as="details"
            className="group rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-5 shadow-[var(--shadow-1)]"
            delay={0.15}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="font-medium">How long does the free profile take?</span>
              <span className="ml-4 text-gray-500 transition group-open:rotate-45">＋</span>
            </summary>
            <div className="mt-3 text-[15px] text-[--text-dim]">
              Around 8–10 minutes. You can pause anytime — your progress is saved to your account.
            </div>
          </Reveal>

          <Reveal
            as="details"
            className="group rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-5 shadow-[var(--shadow-1)]"
            delay={0.25}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="font-medium">What do I get with PRO?</span>
              <span className="ml-4 text-gray-500 transition group-open:rotate-45">＋</span>
            </summary>
            <div className="mt-3 text-[15px] text-[--text-dim]">
              A deeper psychological profile (Big 5), higher-precision career matches, personalized resources, and upcoming mentor access — all for a one-time fee.
            </div>
          </Reveal>

          <Reveal
            as="details"
            className="group rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-5 shadow-[var(--shadow-1)]"
            delay={0.35}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="font-medium">Can I edit my answers later?</span>
              <span className="ml-4 text-gray-500 transition group-open:rotate-45">＋</span>
            </summary>
            <div className="mt-3 text-[15px] text-[--text-dim]">
              Yes. The platform lets you revisit each section (Basics, Preferences, RIASEC) and regenerate results anytime.
            </div>
          </Reveal>

          <Reveal
            as="details"
            className="group rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-5 shadow-[var(--shadow-1)]"
            delay={0.45}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between">
              <span className="font-medium">Is my data private?</span>
              <span className="ml-4 text-gray-500 transition group-open:rotate-45">＋</span>
            </summary>
            <div className="mt-3 text-[15px] text-[--text-dim]">
              We take privacy seriously. Your responses are tied to your account, used to generate your results, and not sold to third parties.
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}