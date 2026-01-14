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

// Format time as military (24hr) format: "0057 HRS"
function formatMilitaryTime(date: Date | string | undefined): string {
  if (!date) return "----";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "----";
    const hours = d.getHours().toString().padStart(2, "0");
    const minutes = d.getMinutes().toString().padStart(2, "0");
    return `${hours}${minutes}`;
  } catch {
    return "----";
  }
}

// Format date as military style: "14 JAN 2026"
function formatMilitaryDate(date: Date): string {
  return format(date, "dd MMM yyyy").toUpperCase();
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
    <header className="bg-surface border-b border-border-subtle sticky top-0 z-30 py-4">
      <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left side - Logo + Date/Time */}
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link
            href={logoHref}
            className="text-xl font-black tracking-tight hover:text-accent transition-all duration-200"
          >
            MEREO
          </Link>

          {/* Date and Time Range - only show when session active */}
          {hasActiveSession && currentSession && (
            <div className="flex items-center gap-6">
              {/* Military Date */}
              <span className="text-sm font-black tracking-wide text-text-primary">
                {formatMilitaryDate(new Date())}
              </span>

              {/* Time Range */}
              <span className="text-sm font-mono font-light text-text-secondary">
                {formatMilitaryTime(currentSession.startTime)} - {formatMilitaryTime(currentSession.endTime)} HRS
              </span>
            </div>
          )}
        </div>

        {/* Center - Navigation Links */}
        <div className="flex items-center gap-6">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-5 py-2 text-sm font-black uppercase tracking-wide rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "text-text-primary"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                {link.label}
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side - spacer for balance (session indicator removed) */}
        <div className="flex items-center gap-3 w-[180px] justify-end">
          {!hasActiveSession && (
            <Link
              href="/"
              className="text-xs font-medium text-text-secondary hover:text-accent transition-all duration-200"
            >
              Login &rarr;
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
