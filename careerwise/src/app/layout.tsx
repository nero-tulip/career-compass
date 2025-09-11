import type { Metadata } from "next";
import Link from "next/link";
import HeaderNav from "@/app/components/HeaderNav";
import { Lexend } from "next/font/google";
import "./globals.css";

const lexend = Lexend({
  variable: "--font-lexend",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CareerCompass",
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
  <body className={`${lexend.variable} antialiased`}>
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
      </body>
    </html>
  );
}
