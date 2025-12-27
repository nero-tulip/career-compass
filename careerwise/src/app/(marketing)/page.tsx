"use client";

import JoinPlatformButton from "../components/JoinPlatformButton";
import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  ElementType,
  PropsWithChildren,
} from "react";
import FAQ from "../components/FAQ";

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

// Small, reusable screenshot card with a subtle frame + caption
function ScreenshotCard({
  src,
  alt,
  caption,
  delay = 0,
}: {
  src: string;
  alt: string;
  caption: string;
  delay?: number;
}) {
  return (
    <Reveal
      as="figure"
      delay={delay}
      direction="up"
      className="snap-center shrink-0"
    >
      <div className="rounded-2xl bg-white/80 backdrop-blur border border-black/10 shadow-[var(--shadow-1)] overflow-hidden w-[380px] md:w-[600px]">
        {/* faux device header */}
        <div className="h-8 bg-gradient-to-b from-white/70 to-white/30 border-b border-black/5 flex items-center gap-1 px-3">
          <span className="inline-block w-2 h-2 rounded-full bg-[#FF5F57]" />
          <span className="inline-block w-2 h-2 rounded-full bg-[#FEBC2E]" />
          <span className="inline-block w-2 h-2 rounded-full bg-[#28C840]" />
          <div className="ml-2 text-xs text-gray-500 truncate">
            CareerCompass
          </div>
        </div>

        {/* image */}
        <div className="relative aspect-[3/2]">
          <Image src={src} alt={alt} fill className="object-cover" />
        </div>

        {/* caption */}
        <figcaption className="px-4 py-3 text-sm text-gray-700">
          {caption}
        </figcaption>
      </div>
    </Reveal>
  );
}

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* background textures */}
      <div aria-hidden className="bg-hero absolute inset-0" />
      <div
        aria-hidden
        className="bg-noise absolute inset-0 opacity-[0.06] pointer-events-none"
      />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pt-24 md:pt-36 pb-20">
        {/* gradient blobs */}
        <div aria-hidden className="hero-blob hero-blob--mint" />
        <div aria-hidden className="hero-blob hero-blob--sky" />
        <div aria-hidden className="hero-blob hero-blob--blush" />

        <div className="grid gap-10 md:grid-cols-[1.2fr_1fr] items-center">
          <Reveal as="div" direction="up" delay={0.05}>
            <h1 className="text-balance text-4xl md:text-6xl font-semibold tracking-tight leading-tight glow">
              Finding the perfect career,{" "}
              <span className="text-gradient">for you</span>.
            </h1>
            <Reveal
              as="p"
              className="mt-6 text-lg text-[--text-dim] max-w-prose"
              delay={0.15}
            >
              We combine{" "}
              <span className="underline-accent-green">
                psychological assessments
              </span>{" "}
              with <span className="underline-accent">job-market insight</span>{" "}
              to help you find career environments where you’ll thrive.
            </Reveal>

            <Reveal
              as="div"
              className="mt-8 flex flex-wrap items-center gap-4"
              delay={0.25}
            >
              <JoinPlatformButton />
              <a href="#how-it-works" className="btn btn-ghost">
                How it works
              </a>
            </Reveal>

            <Reveal
              as="div"
              className="mt-6 flex flex-wrap gap-3 text-sm text-[--text-dim]"
              delay={0.35}
            >
              <span className="badge">Psychological analysis</span>
              <span className="badge">Job market insight</span>
              <span className="badge">Resources and mentorship</span>
            </Reveal>
          </Reveal>

          {/* image column — no white box, aligned with text, larger */}
          <Reveal
            as="div"
            className="relative min-h-[420px] md:min-h-[520px]"
            direction="left"
            delay={0.15}
          >
            <Image
              src="/hero-illustration.svg"
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
        <Reveal
          as="h2"
          className="text-3xl md:text-5xl font-semibold mb-8"
          delay={0.05}
        >
          The problem
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2">
          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.05}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Problem #1
            </div>
            <p className="text-lg leading-relaxed">
              <span className="underline-accent">Lack of self-awareness</span>:
              few people have a clear, psychological understanding of{" "}
              <span className="underline-accent">who they are</span>.
            </p>
          </Reveal>

          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.15}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Problem #2
            </div>
            <p className="text-lg leading-relaxed">
              <span className="underline-accent-green">
                Lack of job-market knowledge
              </span>
              : even fewer people know what roles and paths are available or{" "}
              <span className="underline-accent-green">how to pursue them</span>
              .
            </p>
          </Reveal>
        </div>
      </section>

      {/* OUR APPROACH */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <Reveal
          as="h2"
          className="text-3xl md:text-5xl font-semibold mb-8"
          delay={0.05}
        >
          Our approach
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.05}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Step 1
            </div>
            <h3 className="font-medium mb-2">Data Collection</h3>
            <p className="text-[15px] text-[--text-dim]">
              We'll get to know you through a number of psychometric
              assessments.
            </p>
          </Reveal>

          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.15}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Step 2
            </div>
            <h3 className="font-medium mb-2">Mapping & Analysis</h3>
            <p className="text-[15px] text-[--text-dim]">
              Utilizing government-collected data, we map your RIASEC profile
              and personality traits to career environments where you’re most
              likely to thrive.
            </p>
          </Reveal>

          <Reveal
            className="rounded-2xl border border-black/10 bg-white/70 backdrop-blur p-6 shadow-[var(--shadow-1)]"
            delay={0.25}
          >
            <div className="text-sm uppercase tracking-wide text-gray-500 mb-2">
              Step 3
            </div>
            <h3 className="font-medium mb-2">Kicking Goals</h3>
            <p className="text-[15px] text-[--text-dim]">
              We'll provide you with personalized resources and mentor guidance
              to help you achieve your career goals.
            </p>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS — product screenshot scroller */}
      <section
        id="how-it-works"
        className="relative mx-auto max-w-6xl px-4 py-20"
      >
        <Reveal
          as="h2"
          className="text-center text-3xl md:text-5xl font-semibold"
          delay={0.05}
        >
          How it works (a quick look)
        </Reveal>

        {/* subtle rail background */}
        <div
          aria-hidden
          className="mt-10 h-[2px] bg-[linear-gradient(to_right,transparent,rgba(0,0,0,0.08),transparent)] rounded"
        />

        {/* horizontal scroller */}
        <div
          className="
      mt-8 flex gap-6 overflow-x-auto snap-x snap-mandatory pb-4
      [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden
    "
        >
          {/* Replace src paths with your real screenshots */}
          <ScreenshotCard
            src="/assets/screenshot1.png"
            alt="Intro flow"
            caption="Answer quick, research-backed questions."
            delay={0.05}
          />
          <ScreenshotCard
            src="/assets/screenshot2.png"
            alt="RIASEC assessment"
            caption="Build your RIASEC profile and discover natural interests."
            delay={0.1}
          />
          <ScreenshotCard
            src="/assets/screenshot3.png"
            alt="Work values report"
            caption="See the work conditions where you thrive."
            delay={0.15}
          />
          <ScreenshotCard
            src="/assets/screenshot4.png"
            alt="Career matches"
            caption="Explore tailored career environments with fit explanations."
            delay={0.2}
          />
          <ScreenshotCard
            src="/public/assets/screenshot5.png"
            alt="Resources & roadmap"
            caption="Get a short roadmap and curated resources to move forward."
            delay={0.25}
          />
        </div>

        {/* foot notes */}
        <Reveal
          as="p"
          className="mt-6 text-center text-sm text-[--text-dim]"
          delay={0.15}
        >
          Drag to explore • Screens represent typical results; your experience
          adapts to your answers.
        </Reveal>
      </section>

      {/* DEMO VIDEO */}
      <section className="relative mx-auto max-w-6xl px-4 pb-20">
        <div className="rounded-2xl overflow-hidden bg-black/5 border border-black/5 shadow-[var(--shadow-2)]">
          <div className="aspect-video w-full bg-black/70">
            <video
              className="h-full w-full object-cover"
              src="/assets/platform-demo.mp4"
              autoPlay
              muted
              loop
              playsInline
            />
          </div>
          <div className="p-5 md:p-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">See it in action</h3>
              <p className="text-sm text-[--text-dim]">
                Real UI. Real results. This is what paying users get.
              </p>
            </div>
            {/* optional button */}
            <a
              href="#"
              className="hidden md:inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)]"
            >
              View full walkthrough →
            </a>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS (flowing quotes) */}
      <section className="relative mx-auto max-w-6xl px-4 py-20">
        <Reveal
          as="h2"
          className="text-center text-3xl font-semibold"
          delay={0.05}
        >
          What people are saying
        </Reveal>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          <Reveal className="quote" delay={0.05}>
            “Told me things about myself I didn't even know. Super insightful.
            No one in school or uni ever focused on these things.”
            <cite>— Annie, 22 (Sydney, Aus)</cite>
          </Reveal>
          <Reveal className="quote" delay={0.15}>
            “So much better than what was offered in school in terms of
            guidance. The increased self-awareness alone was incredibly
            helpful.”
            <cite>— James, 20 (London, UK)</cite>
          </Reveal>
          <Reveal className="quote" delay={0.25}>
            “Helped me feel more confident in the uni degree I chose. I now feel
            like I have a plan with a goal and I know how to get there.”
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
          <p className="muted mt-2">
            Start now and get a research-based snapshot of where you’ll thrive.
          </p>
          <div className="mt-6 flex justify-center">
            <JoinPlatformButton />
          </div>
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="relative mx-auto max-w-5xl px-4 pb-24">
        <Reveal
          as="h2"
          className="text-2xl md:text-3xl font-semibold mb-6 text-center"
          delay={0.05}
        >
          Frequently asked questions
        </Reveal>
        <div className="space-y-3">
        <Reveal
          as="div"
          className="w-full"
          delay={0.05}
        >
          <FAQ />
        </Reveal>
        </div>
      </section>
    </div>
  );
}
