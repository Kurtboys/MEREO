"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentSession, useStoreHydration } from "./store";
import { getTodayDateString } from "./utils";

/**
 * Hook that requires an active session for the current day.
 * Redirects to login page if no active session exists.
 *
 * @param redirectTo - Where to redirect if no session (default: "/")
 * @returns { isLoading, hasSession } - Loading state and session status
 */
export function useRequireSession(redirectTo: string = "/") {
  const router = useRouter();
  const hydrated = useStoreHydration();
  const currentSession = useCurrentSession();

  useEffect(() => {
    if (!hydrated) return;

    const hasValidSession =
      currentSession?.isActive && currentSession.date === getTodayDateString();

    if (!hasValidSession) {
      router.push(redirectTo);
    }
  }, [currentSession, hydrated, redirectTo, router]);

  const hasValidSession =
    currentSession?.isActive && currentSession.date === getTodayDateString();

  return {
    isLoading: !hydrated,
    hasSession: hydrated && hasValidSession,
  };
}

/**
 * Hook that checks for session status without redirecting.
 * Useful for components that need to conditionally render based on session.
 *
 * @returns { isLoading, hasSession, session }
 */
export function useSessionStatus() {
  const hydrated = useStoreHydration();
  const currentSession = useCurrentSession();

  const hasValidSession =
    currentSession?.isActive && currentSession.date === getTodayDateString();

  return {
    isHydrated: hydrated,
    hasSession: hydrated && hasValidSession,
    session: hydrated ? currentSession : null,
  };
}

/**
 * Hook for managing time-based updates (for timers, clocks, etc.)
 *
 * @param intervalMs - Update interval in milliseconds (default: 1000)
 * @returns Current Date object that updates at the specified interval
 */
export function useCurrentTime(intervalMs: number = 1000) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return currentTime;
}
