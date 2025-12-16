// src/app/components/ReportNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useMemo } from "react";

type ReportKey = "overview" 
| "riasec" 
| "big5" 
| "values" 
| "team-role" 
| "environment" 
| "skills" 
| "decision-making"
| "career-clusters"
| "next-steps";

type Item = {
  key: ReportKey;
  title: string;
  // Build an href given rid
  href: (rid: string) => string;
};

const DEFAULT_ITEMS: Item[] = [
  {
    key: "overview",
    title: "Overview",
    href: (rid) => `/app/report/overview?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "riasec",
    title: "RIASEC",
    href: (rid) => `/app/report/riasec?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "big5",
    title: "Big-5",
    href: (rid) => `/app/report/big5?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "values",
    title: "Work Values",
    href: (rid) => `/app/report/values?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "team-role",
    title: "Team Roles",
    href: (rid) => `/app/report/team-role?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "environment",
    title: "Environment",
    href: (rid) => `/app/report/environment?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "skills",
    title: "Skills",
    href: (rid) => `/app/report/skills?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "decision-making",
    title: "Decision Making",
    href: (rid) => `/app/report/decision-making?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "career-clusters",
    title: "Careers",
    href: (rid) => `/app/report/career-clusters?rid=${encodeURIComponent(rid)}`,
  },
  {
    key: "next-steps",
    title: "Next Steps",
    href: (rid) => `/app/report/next-steps?rid=${encodeURIComponent(rid)}`,
  },
];

export type ReportNavProps = {
  rid: string;
  items?: Item[];
  className?: string;
};

function cls(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const ReportNav = memo(function ReportNav({
  rid,
  items = DEFAULT_ITEMS,
  className,
}: ReportNavProps) {
  const pathname = usePathname();

  // Determine active tab by matching the path segment after /app/report/
  const activeKey = useMemo<ReportKey | null>(() => {
    if (!pathname) return null;
    const seg = pathname.split("/").filter(Boolean); // ["app","report","riasec"]
    const page = seg[2] ?? "overview";

    if (page === "report") return "overview"; // handle root /app/report

    const validKeys: ReportKey[] = ["overview", "riasec", "big5", "values", "team-role", "environment", "skills", "decision-making", "career-clusters", "next-steps"];
    return validKeys.includes(page as ReportKey) ? (page as ReportKey) : null;
  }, [pathname]);

  return (
    <nav
      aria-label="Report navigation"
      className={cls(
        "w-full",
        "rounded-2xl border border-gray-200 bg-white p-2 sm:p-3",
        className
      )}
    >
      <ul className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {items.map((it) => {
          const isActive = it.key === activeKey;
          return (
            <li key={it.key}>
              <Link
                href={it.href(rid)}
                className={cls(
                  "group inline-block rounded-xl px-3 py-2 text-[8px] sm:text-sm transition-all text-center",
                  "ring-1 ring-black/5 hover:shadow-sm whitespace-nowrap",
                  isActive
                    ? "bg-[var(--mint-200)] text-black ring-[var(--mint-200)]"
                    : "bg-white text-gray-700 hover:bg-[var(--mint-50)]"
                )}
              >
                <span
                  className={cls(
                    "font-medium",
                    isActive &&
                      "underline decoration-[var(--mint-600)] underline-offset-4"
                  )}
                >
                  {it.title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
});

export default ReportNav;
