import Link from "next/link";
import HeaderNav from "@/app/components/HeaderNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header sticky top-0 z-30 border-b border-black/5 dark:border-white/10 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-xl">
            CareerCompass
          </Link>
          <HeaderNav />
        </div>
      </header>

      <main className="min-h-screen bg-hero">
        {children}
      </main>

      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>© {new Date().getFullYear()} CareerCompass</span>
        </div>
      </footer>
    </>
  );
}