import Link from "next/link";

export default function Home() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-6xl font-semibold tracking-tight leading-tight">
              Find your work fit.
            </h1>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-500 max-w-prose">
              Take a sleek, minimal RIASEC-based quiz to understand your strengths
              and discover work environments that suit you.
            </p>
            <div className="mt-8 flex items-center gap-4">
              <Link href="/quiz" className="btn btn-primary shadow-sm">
                Start the quiz
              </Link>
              <a href="#how-it-works" className="btn btn-outline">
                Learn more
              </a>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-2xl border border-black/5 dark:border-white/10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] bg-[radial-gradient(circle_at_30%_30%,rgba(var(--primary-rgb)/0.35),transparent_60%)]" />
          </div>
        </div>
      </div>

      <div id="how-it-works" className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl border border-black/5 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5">
            <h3 className="font-medium">Answer thoughtfully</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">Two parts: big-picture values, then a quick interests check.</p>
          </div>
          <div className="rounded-xl border border-black/5 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5">
            <h3 className="font-medium">See your profile</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">We map your answers to the RIASEC model to show strengths.</p>
          </div>
          <div className="rounded-xl border border-black/5 dark:border-white/10 p-6 bg-white/60 dark:bg-white/5">
            <h3 className="font-medium">Get direction</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-500">Receive a clean summary and matched roles to explore.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
