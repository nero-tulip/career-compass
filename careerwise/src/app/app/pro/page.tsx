// src/app/app/pro/page.tsx
"use client";

import Link from "next/link";
import { useAuth } from "@/app/providers/AuthProvider";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const FEATURES = [
  "Fully integrated Results Report, providing specific, personalized career advice",
  "Personalized Resources relevant to the stage of your career journey",
  "Access to experts through our Mentor Network (coming soon!)",
  "Lifetime access to the platform as we add more features",
];

const FAQ = [
  {
    q: "Why a one-time fee and not a subscription?",
    a: "Aren't we all sick of monthly subscriptions? Pay once, get lifetime access to all current and future PRO features. You join the club and get taken along for the ride as we grow, improve and iterate upon the platform.",
  },
  {
    q: "Will the price stay the same indefinitely?",
    a: "Most likely not. As we grow and continue to add new features, lifetime pricing will likely increase to reflect the improved functionality and features over time.",
  },
  {
    q: "Can I retake the quizzes in the future?",
    a: "Yes, absolutely! We realize that you're likely to grow and change, and so is your understanding of who you are. This means your answers to psychological questions may change over time and require updating. You can retake the quizzes as many times as you like to improve your score and understanding.",
  },
  {
    q: "How is payment handled?",
    a: "Payment is processed securely through Stripe. We do not store any payment information on our servers. After payment, your account will be automatically upgraded to PRO status.",
  },
];

export default function ProPage() {
  const { user } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "";

  useEffect(() => {
    // (Optional) basic analytics stub
    // window.posthog?.capture('view_pro_pricing', { from });
  }, [from]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <header className="text-center space-y-3">
        <div className="inline-block rounded-full ring-1 ring-black/10 px-3 py-1 text-xs text-gray-600 bg-white/80 backdrop-blur-sm">
          Lifetime Deal
        </div>
        <h1 className="text-3xl md:text-5xl font-semibold tracking-tight">
          <span className="text-gradient">CareerCompass Pro</span>
        </h1>
        <p className="text-[--text-dim] max-w-2xl mx-auto">
          A one-time fee of <strong>$39</strong> for lifetime access. <br /> We
          keep adding features to the platform; you never pay an additional
          dollar.
        </p>
      </header>

      <section className="mt-8 grid md:grid-cols-[1.2fr_.8fr] gap-6 items-start">
        {/* Left: value & features */}
        <div className="rounded-2xl bg-white p-6 space-y-6 shadow-sm ring-1 ring-black/5 bg-gradient-to-br from-cyan-50 via-violet-50 to-rose-50">
          <h2 className="text-xl font-semibold">
            How CareerCompass Pro is going to change your life:
          </h2>
          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2">
                <span className="mt-1">👉</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-white p-4 text-sm text-gray-700 shadow-sm ring-1 ring-black/5">
            <div className="font-medium mb-1">Why now?</div>
            <p>
              We’re continuously adding features and so this price is likely the
              lowest it’ll ever be. Lock in lifetime access today and secure
              your future growth, forever.
            </p>
          </div>
        </div>

        {/* Right: pricing card + future features */}
        <div className="relative">
          {/* Pricing (sticky) */}
          <div className="rounded-2xl bg-white p-6 sticky top-4 shadow-sm ring-1 ring-black/5">
            <div className="text-sm text-gray-600">Lifetime Access</div>
            <div className="mt-1 text-4xl font-bold">$39</div>
            <div className="text-xs text-gray-600">one-time payment</div>

            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span>•</span> No subscription
              </div>
              <div className="flex items-center gap-2">
                <span>•</span> All future PRO features
              </div>
              <div className="flex items-center gap-2">
                <span>•</span> 14-day refund policy
              </div>
            </div>

            <Link
              href={`/app/pro/checkout${
                from ? `?from=${encodeURIComponent(from)}` : ""
              }`}
              className="mt-6 block w-full text-center btn btn-primary"
              onClick={() => {
                // window.posthog?.capture('click_pro_cta', { from });
              }}
            >
              Join CareerCompass Pro - $39
            </Link>

            {!user ? (
              <p className="text-xs text-gray-600 mt-3 text-center">
                You’ll be asked to log in or create a free account.
              </p>
            ) : (
              <p className="text-xs text-gray-600 mt-3 text-center">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
            )}
          </div>

          {/* Future features (colorful) */}
          <div className="mt-4 rounded-2xl p-5 shadow-sm ring-1 ring-black/5 ">
            <div className="text-xs font-medium text-gray-700 mb-1">
              Included with Pro (lifetime)
            </div>
            <h3 className="text-lg font-semibold">Upcoming features 🚀</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-800">
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Mentorship access and matching</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Career roadmap builder</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>Interview prep & resume guidance</span>
              </li>
              <li className="flex items-start gap-2">
                <span>✨</span>
                <span>
                  Psychological tools to help orient the next 5 years of your
                  life
                </span>
              </li>
            </ul>
            <p className="mt-3 text-xs text-gray-700">
              Pay once, get them all — your price never changes as we ship.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mt-16">
        <h2 className="text-xl font-semibold text-center mb-6">
          What people are saying
        </h2>

        <div className="relative overflow-hidden">
          {/* gradient fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[--background] to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[--background] to-transparent z-10" />

          {/* marquee track */}
          <div className="marquee">
            {/* one sequence */}
            <ul className="flex gap-8 shrink-0 py-4">
              {[
                "“Wish I had this before I chose my university course. Would've saved me a bunch of time.”",
                "“I've done other psychometric tests before but I've never had them integrated into a personalized career plan with specific recommendations and actionable steps.”",
                "“Have no idea why this idea hasn't been built before and implemented in schools everywhere. Everyone should know more about themselves and which careers are most right for them.”",
                "“Definitely worth the money... clarity before making one of the biggest decisions of your life is a must.”",
                "“Actually helped to clear up a lot of my stress and anxiety about what I was going to do with my life. It was all a haze before, but this helped a lot.”",
                "“Kinda feels like a mix between a career coach and a therapist (in a good way, lol). I'd definitely pay for it, especially if I knew it was this good.”",
                "“The integration of the quizzes made me feel really 'seen' in a way that the career counsellors in school really failed to do. Their advice was so generic.”",
                "“Can't wait to see what the full-version with future features looks like. I think the platform has the potential to change lives in a really positive way. Good luck!”",
              ].map((t, i) => (
                <li
                  key={`a-${i}`}
                  className="flex-none w-[320px] max-w-[80vw] h-[120px] flex items-center justify-center text-center rounded-2xl px-6 py-4 bg-white text-gray-800 text-sm shadow-md ring-1 ring-black/5 whitespace-normal break-words"
                >
                  {t}
                </li>
              ))}
              <li className="flex-none w-4" aria-hidden="true" />
            </ul>

            {/* duplicate sequence for seamless loop */}
            <ul className="flex gap-8 shrink-0 py-4" aria-hidden="true">
              {[
                "“Wish I had this before I chose my university course. Would've saved me a bunch of time.”",
                "“I've done other psychometric tests before but I've never had them integrated into a personalized career plan with specific recommendations and actionable steps.”",
                "“Have no idea why this idea hasn't been built before and implemented in schools everywhere. Everyone should know more about themselves and which careers are most right for them.”",
                "“Definitely worth the money... clarity before making one of the biggest decisions of your life is a must.”",
                "“Actually helped to clear up a lot of my stress and anxiety about what I was going to do with my life. It was all a haze, but this helped a lot.”",
                "“Kinda feels like a mix between a career coach and a therapist (in a good way, lol). I'd definitely pay for it, especially if I knew it was this good.”",
                "“The integration of the quizzes made me feel really 'seen' in a way that the career counsellors in school really failed to do. Their advice was so generic.”",
                "“Can't wait to see what the full-version with future features looks like. I think the platform has the potential to change lives in a really positive way. Good luck!”",
              ].map((t, i) => (
                <li
                  key={`a-${i}`}
                  className="flex-none w-[320px] max-w-[80vw] h-[120px] flex items-center justify-center text-center rounded-2xl px-6 py-4 bg-white text-gray-800 text-sm shadow-md ring-1 ring-black/5 whitespace-normal break-words"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4">
          Frequently asked questions
        </h2>
        <div className="space-y-3">
          {FAQ.map(({ q, a }) => (
            <details
              key={q}
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5"
            >
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm text-gray-700">{a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="mt-10 text-center text-xs text-gray-500">
        Secure checkout. You’ll receive a receipt and PRO is applied to your
        account automatically after payment.
      </footer>
    </div>
  );
}
