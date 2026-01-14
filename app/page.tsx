"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { useMereoStore, useStoreHydration } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { getTodayDateString } from "@/lib/utils";

// Default end time: 4 AM the next calendar day
const DEFAULT_DAY_END_HOUR = 4;

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useStoreHydration();
  const { dayStarted } = useToast();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const { missions, currentSession, startDaySession } = useMereoStore();

  // Get yesterday's incomplete/bottleneck missions
  const carryoverMissions = missions.filter(
    (m) =>
      m.scheduledDate !== getTodayDateString() &&
      (m.status === "incomplete" || m.status === "bottleneck")
  );

  // Also count today's missions that are incomplete/bottleneck (from previous sessions)
  const todayPendingMissions = missions.filter(
    (m) =>
      m.scheduledDate === getTodayDateString() &&
      (m.status === "incomplete" || m.status === "bottleneck")
  );

  const waitingMissions = carryoverMissions.length + todayPendingMissions.length;

  // Update current time every second
  useEffect(() => {
    setCurrentTime(new Date());
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // If already logged in for today, redirect to /today
  useEffect(() => {
    if (!hydrated) return;
    if (currentSession?.isActive && currentSession.date === getTodayDateString()) {
      router.push("/today");
    }
  }, [currentSession, router, hydrated]);

  const handleLoginClick = () => {
    // Calculate end time: 4 AM the next calendar day
    const now = new Date();
    const endTime = new Date(now);
    endTime.setDate(endTime.getDate() + 1); // Tomorrow
    endTime.setHours(DEFAULT_DAY_END_HOUR, 0, 0, 0); // 4:00 AM

    startDaySession(endTime);
    dayStarted();
    router.push("/today");
  };

  // Show loading state until client hydrates
  if (!currentTime || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Wordmark */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight mb-4"
      >
        MEREO
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
        className="text-text-secondary text-lg md:text-xl mb-8"
      >
        Missions. Not tasks.
      </motion.p>

      {/* Current Time */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
      >
        <span className="font-mono font-light text-3xl md:text-4xl text-text-secondary">
          {format(currentTime, "h:mm:ss a")}
        </span>
      </motion.div>

      {/* Login Button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
        whileHover={{
          y: -2,
          textShadow: "0 0 20px rgba(59, 130, 246, 0.6)",
        }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLoginClick}
        style={{
          marginTop: "3rem",
          padding: "1rem 2rem",
          backgroundColor: "transparent",
          color: "#FFFFFF",
          fontWeight: 900,
          fontSize: "1.5rem",
          border: "none",
          borderBottom: "2px solid #3B82F6",
          boxShadow: "0 4px 15px -3px rgba(59, 130, 246, 0.3)",
          transition: "all 200ms ease",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderBottomWidth = "3px";
          e.currentTarget.style.boxShadow = "0 6px 25px -3px rgba(59, 130, 246, 0.5)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderBottomWidth = "2px";
          e.currentTarget.style.boxShadow = "0 4px 15px -3px rgba(59, 130, 246, 0.3)";
        }}
      >
        Login For The Day
      </motion.button>

      {/* Carryover Indicator */}
      <AnimatePresence>
        {waitingMissions > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="mt-6 flex items-center gap-2 text-status-warning"
          >
            <span className="w-2 h-2 rounded-full bg-status-warning animate-pulse" />
            <span className="text-sm">
              {waitingMissions} mission{waitingMissions !== 1 ? "s" : ""} waiting
              from yesterday
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Version indicator - remove after testing */}
      <div className="fixed bottom-4 right-4 text-xs text-text-disabled/50 font-mono">
        v0.4.0
      </div>
    </div>
  );
}
