import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/app/providers/AuthProvider";

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
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${lexend.variable} antialiased`}>
        {/* Provide auth globally, but DO NOT render any header/footer here */}
        <AuthProvider>
          {/* Root should not use <main> if nested layouts might also use <main>. */}
          <div className="min-h-screen">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}