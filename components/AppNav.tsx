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
    <header className="bg-surface border-b border-border-subtle sticky top-0 z-30">
      <nav className="max-w-7xl mx-auto px-10 py-8 flex items-center justify-between">
        {/* Left side - Logo only */}
        <div className="flex items-center w-[200px]">
          <Link
            href={logoHref}
            className="text-2xl font-black tracking-tight hover:text-accent transition-all duration-200"
          >
            MEREO
          </Link>
        </div>

        {/* Center - Navigation Links */}
        <div className="flex items-center gap-14">
          {visibleLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-2xl font-black tracking-tight transition-all duration-200 relative pb-2",
                  isActive
                    ? "text-text-primary"
                    : "text-text-disabled hover:text-text-secondary"
                )}
              >
                {link.label}
                {/* Active indicator - underline */}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-accent rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Right side - spacer for balance */}
        <div className="flex items-center w-[200px] justify-end">
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
