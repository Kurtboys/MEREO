"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface TimerProps {
  /** ISO date string or Date when the mission started */
  startedAt: string | Date | null | undefined;
  /** Total estimated minutes for the mission */
  totalMinutes: number;
  /** Optional className for container */
  className?: string;
}

/**
 * Timer component that counts down from totalMinutes
 * Shows overtime when time runs out
 */
export function Timer({ startedAt, totalMinutes, className }: TimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const totalSeconds = totalMinutes * 60;
  const remainingSeconds = totalSeconds - elapsedSeconds;
  const isOvertime = remainingSeconds <= 0;
  const isWarning = !isOvertime && remainingSeconds <= totalSeconds * 0.25;

  // Timer effect
  useEffect(() => {
    if (!startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startDate = typeof startedAt === "string" ? new Date(startedAt) : startedAt;
    const startTime = startDate.getTime();

    // Guard against invalid dates
    if (isNaN(startTime)) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const absSeconds = Math.abs(seconds);
    const hours = Math.floor(absSeconds / 3600);
    const minutes = Math.floor((absSeconds % 3600) / 60);
    const secs = absSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const displayTime = isOvertime
    ? `+${formatTime(elapsedSeconds - totalSeconds)}`
    : formatTime(remainingSeconds);

  return (
    <div className={cn("text-center", className)}>
      <div
        className={cn(
          "font-mono text-[56px] leading-none font-light tracking-tight transition-colors",
          isOvertime
            ? "text-status-warning"
            : isWarning
              ? "text-status-warning animate-pulse-slow"
              : "text-text-primary"
        )}
      >
        {displayTime}
      </div>
      <p className="text-text-secondary text-sm mt-2">
        {isOvertime ? "overtime" : "remaining"}
      </p>
    </div>
  );
}
