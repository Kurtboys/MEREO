"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { useCurrentSession, useStoreHydration } from "@/lib/store";
import { cn } from "@/lib/utils";

interface NavLink {
  href: string;
  label: string;
  requiresSession: boolean;
}

const navLinks: NavLink[] = [
  { href: "/today", label: "Today", requiresSession: true },
  { href: "/whiteboard", label: "Whiteboard", requiresSession: true },
  { href: "/scheduler", label: "Scheduler", requiresSession: false },
];

// Format date in casual style: "Jan 14th, 2026"
function formatCasualDate(date: Date): string {
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  return format(date, "MMM") + " " + day + suffix + ", " + format(date, "yyyy");
}

function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return "th";
  switch (day % 10) {
    case 1: return "st";
    case 2: return "nd";
    case 3: return "rd";
    default: return "th";
  }
}

export function AppNav() {
  const pathname = usePathname();
  const hydrated = useStoreHydration();
  const currentSession = useCurrentSession();
  const hasActiveSession = hydrated && (currentSession?.isActive ?? false);

  // Filter links based on session state
  const visibleLinks = navLinks.filter(
    (link) => !link.requiresSession || hasActiveSession
  );

  // Determine where the logo should link to
  const logoHref = hasActiveSession ? "/today" : "/";

  return (
    <header className="bg-surface border-b border-border-subtle sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
        {/* Left side - Logo + Date */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href={logoHref}
            className="text-xl font-black tracking-tight hover:text-accent transition-all duration-200"
          >
            MEREO
          </Link>

          {/* Date - casual format, only when session active */}
          {hasActiveSession && (
            <span className="text-sm font-medium text-text-secondary">
              {formatCasualDate(new Date())}
            </span>
          )}
        </div>

        {/* Center - Navigation Links */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-10">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-xl font-black tracking-tight transition-all duration-200 relative pb-1",
                  isActive
                    ? "text-text-primary"
                    : "text-text-disabled hover:text-text-secondary"
                )}
              >
                {link.label}
                {/* Active indicator - underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side - spacer for balance */}
        <div className="flex items-center gap-3 w-[180px] justify-end">
          {!hasActiveSession && (
            <Link
              href="/"
              className="text-sm text-text-secondary hover:text-accent transition-all duration-200"
            >
              Login &rarr;
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
