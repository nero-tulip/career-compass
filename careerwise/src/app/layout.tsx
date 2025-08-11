import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareerWise — Find your work fit",
  description:
    "A sleek, minimal career interests quiz powered by RIASEC to help you understand your strengths and work style.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="sticky top-0 z-30 border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-black/30 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight text-xl">
              CareerWise
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/quiz" className="px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                Take the quiz
              </Link>
            </nav>
          </div>
        </header>
        <main className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-white to-white dark:from-slate-950 dark:via-black dark:to-black">
          {children}
        </main>
        <footer className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-gray-500 dark:text-gray-400 flex items-center justify-between">
            <span>© {new Date().getFullYear()} CareerWise</span>
            <span className="opacity-80">Made with Next.js</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
