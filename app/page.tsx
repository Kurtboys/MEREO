"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format, addHours, setHours, setMinutes } from "date-fns";
import { useMereoStore, useStoreHydration } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { getTodayDateString } from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const hydrated = useStoreHydration();
  const { dayStarted } = useToast();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    setIsModalOpen(true);
  };

  const handleStartDay = useCallback(
    (endTime: Date) => {
      startDaySession(endTime);
      setIsModalOpen(false);
      dayStarted();
      router.push("/today");
    },
    [startDaySession, router, dayStarted]
  );

  // Show loading state until client hydrates
  if (!currentTime || !hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
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
          className="mb-10"
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
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLoginClick}
          className="px-16 py-5 bg-[#3B82F6] hover:bg-[#2563EB] text-white font-black text-2xl rounded-lg transition-all duration-200 shadow-lg shadow-[#3B82F6]/20"
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
          v0.2.1
        </div>
      </div>

      {/* End Time Picker Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <EndTimePickerModal
            onClose={() => setIsModalOpen(false)}
            onConfirm={handleStartDay}
            defaultTime={addHours(new Date(), 12)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ============================================
// End Time Picker Modal Component
// ============================================

interface EndTimePickerModalProps {
  onClose: () => void;
  onConfirm: (endTime: Date) => void;
  defaultTime: Date;
}

function EndTimePickerModal({
  onClose,
  onConfirm,
  defaultTime,
}: EndTimePickerModalProps) {
  const [selectedHour, setSelectedHour] = useState(defaultTime.getHours());
  const [selectedMinute, setSelectedMinute] = useState(
    Math.floor(defaultTime.getMinutes() / 15) * 15
  );

  const handleConfirm = () => {
    const endTime = setMinutes(setHours(new Date(), selectedHour), selectedMinute);
    onConfirm(endTime);
  };

  // Format hour for display (12-hour format)
  const formatHour = (hour: number) => {
    const h = hour % 12 || 12;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${h} ${ampm}`;
  };

  // Generate hours array (0-23)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // Generate minutes array (0, 15, 30, 45)
  const minutes = [0, 15, 30, 45];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="fixed inset-0 bg-void/80 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="w-full max-w-sm bg-surface border border-border-subtle rounded-2xl p-8 shadow-2xl pointer-events-auto">
          {/* Title */}
          <h2 className="text-2xl font-black text-center mb-2">
            When does your day end?
          </h2>
          <p className="text-text-secondary text-center text-sm mb-8">
            Set your target end time for today
          </p>

          {/* Time Picker */}
          <div className="flex items-center justify-center gap-4 mb-8">
            {/* Hour Selector */}
            <div className="flex flex-col items-center">
              <label className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
                Hour
              </label>
              <select
                value={selectedHour}
                onChange={(e) => setSelectedHour(Number(e.target.value))}
                className="w-28 px-4 py-3 bg-void border border-border-subtle rounded-lg text-text-primary text-center font-mono text-lg appearance-none cursor-pointer focus:outline-none focus:border-border-focus"
              >
                {hours.map((hour) => (
                  <option key={hour} value={hour}>
                    {formatHour(hour)}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-3xl text-text-secondary mt-6">:</span>

            {/* Minute Selector */}
            <div className="flex flex-col items-center">
              <label className="text-xs text-text-secondary mb-2 uppercase tracking-wide">
                Min
              </label>
              <select
                value={selectedMinute}
                onChange={(e) => setSelectedMinute(Number(e.target.value))}
                className="w-20 px-4 py-3 bg-void border border-border-subtle rounded-lg text-text-primary text-center font-mono text-lg appearance-none cursor-pointer focus:outline-none focus:border-border-focus"
              >
                {minutes.map((min) => (
                  <option key={min} value={min}>
                    {min.toString().padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview */}
          <div className="text-center mb-8">
            <span className="text-text-secondary text-sm">Your day ends at </span>
            <span className="font-mono text-accent">
              {(selectedHour % 12 || 12)}:{selectedMinute.toString().padStart(2, "0")}
              {selectedHour >= 12 ? " PM" : " AM"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-void border border-border-subtle text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="flex-1 px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-lg transition-colors"
            >
              Start My Day
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
