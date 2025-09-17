"use client";

import { useState } from "react";

export default function WaitlistPage() {
  const [form, setForm] = useState({ name: "", age: "", email: "", country: "" });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "dup" | "error">("idle");

  const update = (k: string, v: any) => setForm((s) => ({ ...s, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "submit_failed");
      if (data?.duplicate) {
        setStatus("dup");
        return;
      }
      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  };

  if (status === "success" || status === "dup") {
    return (
      <section className="relative overflow-hidden">
        {/* soft background ornaments */}
        <BgOrnaments />

  <div className="mx-auto max-w-2xl px-4 pt-28 md:pt-40 pb-24 text-center">
          <h1 className="text-4xl font-semibold">You’re on the list ✅</h1>
          <p className="mt-3 muted">
            Thanks for joining. We’ll email you when CareerCompass opens up.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden">
      {/* soft background ornaments */}
      <BgOrnaments />

      {/* HERO */}
      <div className="mx-auto max-w-6xl px-4 pt-20 pb-10 md:pt-28">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              Find direction, not just another quiz.
            </h1>
            <p className="mt-4 text-lg muted max-w-prose">
              Most people struggle with <strong>self-awareness</strong> and{" "}
              <strong>job-market clarity</strong>. CareerCompass gives you both:
              a science-backed profile and practical paths to pursue.
            </p>

            <div className="mt-8 flex items-center gap-3">
              <a href="#join" className="btn btn-primary">Join the waitlist</a>
              <a href="#how" className="btn btn-ghost">How it helps</a>
            </div>
          </div>

          {/* Hero visual */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl card p-0 overflow-hidden">
              <div className="absolute inset-0"
                   style={{
                     background:
                       "radial-gradient(70% 60% at 20% 30%, var(--mint-50), transparent 60%), " +
                       "radial-gradient(60% 50% at 80% 20%, var(--sky-50), transparent 60%), " +
                       "radial-gradient(60% 60% at 50% 90%, var(--blush-50), transparent 60%)",
                   }}
              />
              <div className="absolute inset-0 grid grid-cols-12 opacity-[0.08] pointer-events-none"
                   style={{ backgroundImage: "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)", color: "var(--border)" }}>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PROBLEM / SOLUTION */}
      <div id="how" className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="surface p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-2">The problem</h3>
            <ul className="list-disc list-inside space-y-2 muted">
              <li>Hard to know your strengths and motivations with confidence.</li>
              <li>Messy job landscape: too many roles, unclear pathways.</li>
              <li>Generic quizzes produce generic advice.</li>
            </ul>
          </div>
          <div className="surface p-6 rounded-2xl">
            <h3 className="text-xl font-semibold mb-2">The solution</h3>
            <ul className="list-disc list-inside space-y-2 muted">
              <li>Evidence-based interests & personality profiling (RIASEC + Big Five).</li>
              <li>Contextual career matches with plain-English next steps.</li>
              <li>Clean, friendly UI that guides decisions—not noise.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* VALUE PILLARS */}
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid md:grid-cols-3 gap-6">
          <Pillar
            title="Know yourself"
            copy="See your interests and traits translated into strengths you can use."
            badge="Personal insight"
          />
          <Pillar
            title="See real options"
            copy="Understand roles, environments, and learning paths that fit you."
            badge="Market clarity"
          />
          <Pillar
            title="Act with confidence"
            copy="Get focused suggestions so your next step isn’t a guess."
            badge="Actionable steps"
          />
        </div>
      </div>

      {/* FORM */}
      <div id="join" className="mx-auto max-w-3xl px-4 py-16">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-semibold">Join the waitlist</h2>
          <p className="mt-2 muted">Four quick fields. No spam—ever.</p>
        </div>

        <form onSubmit={submit} className="surface-2 p-6 md:p-8 rounded-2xl space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <Field
              label="Name"
              required
              value={form.name}
              onChange={(v) => update("name", v)}
              placeholder="Alex"
            />
            <Field
              label="Age"
              type="number"
              required
              value={form.age}
              onChange={(v) => update("age", v)}
              placeholder="19"
            />
          </div>

          <Field
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(v) => update("email", v)}
            placeholder="alex@example.com"
          />

          <Field
            label="Country"
            required
            value={form.country}
            onChange={(v) => update("country", v)}
            placeholder="Australia"
          />

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn btn-primary w-full sm:w-auto"
            >
              {status === "submitting" ? "Submitting…" : "Join waitlist"}
            </button>
            <a href="/" className="btn btn-ghost w-full sm:w-auto">Back to home</a>
          </div>

          {status === "error" && (
            <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
          )}
        </form>
      </div>

      {/* TESTIMONIAL PLACEHOLDERS */}
      <div className="mx-auto max-w-6xl px-4 pb-24">
        <h3 className="text-center text-xl font-semibold mb-6">What people are saying</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Testimonial quote="It finally made my options feel clear, not overwhelming." name="Student, 17" />
          <Testimonial quote="The report felt personal. It nailed my working style." name="Undergrad, 20" />
          <Testimonial quote="I used it to plan a realistic switch into design." name="Career-changer, 26" />
        </div>
      </div>
    </section>
  );
}

/* ---------- Small, reusable UI bits (no external libs) ---------- */

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm mb-2">{label}</label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl p-3 bg-white border border-[--border] focus:outline-none focus:ring-2 focus:ring-[--primary]/40"
        placeholder={placeholder}
      />
    </div>
  );
}

function Pillar({ title, copy, badge }: { title: string; copy: string; badge: string }) {
  return (
    <div className="card p-6">
      <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{ background: "var(--primary-ghost)" }}>
        {badge}
      </span>
      <h4 className="mt-3 text-lg font-semibold">{title}</h4>
      <p className="mt-2 text-sm muted">{copy}</p>
    </div>
  );
}

function Testimonial({ quote, name }: { quote: string; name: string }) {
  return (
    <div className="surface p-5 rounded-2xl">
      <p className="italic">“{quote}”</p>
      <p className="mt-3 text-sm muted">— {name}</p>
    </div>
  );
}

function BgOrnaments() {
  return (
    <>
      {/* soft radial washes */}
      <div
        className="pointer-events-none absolute -top-24 -left-24 h-[360px] w-[360px] rounded-full blur-3xl opacity-70"
        style={{ background: "radial-gradient(closest-side, var(--mint-50), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -top-10 right-0 h-[300px] w-[340px] rounded-full blur-3xl opacity-70"
        style={{ background: "radial-gradient(closest-side, var(--sky-50), transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute bottom-0 left-1/3 h-[320px] w-[380px] -translate-x-1/2 translate-y-1/3 rounded-full blur-3xl opacity-70"
        style={{ background: "radial-gradient(closest-side, var(--blush-50), transparent 70%)" }}
      />
    </>
  );
}
