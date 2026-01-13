"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <header className="h-14 bg-surface border-b border-border-subtle sticky top-0 z-30">
      <nav className="h-full max-w-7xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={logoHref}
          className="text-xl font-black tracking-tight hover:text-accent transition-all duration-200"
        >
          MEREO
        </Link>

        {/* Navigation Links */}
        <div className="flex items-center gap-1">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 relative",
                  isActive
                    ? "text-accent"
                    : "text-text-secondary hover:text-accent hover:bg-surface-hover"
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

        {/* Right side - session indicator */}
        <div className="flex items-center gap-3">
          {hasActiveSession ? (
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
              <span className="text-xs text-text-secondary">Session Active</span>
            </div>
          ) : (
            <Link
              href="/"
              className="text-xs text-text-secondary hover:text-accent transition-all duration-200"
            >
              Login &rarr;
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
