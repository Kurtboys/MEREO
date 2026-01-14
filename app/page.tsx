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
          v0.2.5
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
  // Convert 24-hour default to 12-hour format
  const defaultHour12 = defaultTime.getHours() % 12 || 12;
  const defaultIsPM = defaultTime.getHours() >= 12;

  const [selectedHour, setSelectedHour] = useState(defaultHour12);
  const [selectedMinute, setSelectedMinute] = useState(
    Math.floor(defaultTime.getMinutes() / 15) * 15
  );
  const [isPM, setIsPM] = useState(defaultIsPM);

  // Convert to 24-hour format for calculations
  const get24Hour = () => {
    if (isPM) {
      return selectedHour === 12 ? 12 : selectedHour + 12;
    } else {
      return selectedHour === 12 ? 0 : selectedHour;
    }
  };

  // Check if end time is tomorrow
  const isNextDay = () => {
    const now = new Date();
    const endTime = new Date();
    endTime.setHours(get24Hour(), selectedMinute, 0, 0);
    return endTime <= now;
  };

  const handleConfirm = () => {
    const endTime = new Date();
    endTime.setHours(get24Hour(), selectedMinute, 0, 0);

    // If end time is before now, it's tomorrow
    if (endTime <= new Date()) {
      endTime.setDate(endTime.getDate() + 1);
    }

    onConfirm(endTime);
  };

  // Generate hours array (1-12)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  // Generate minutes array (0, 15, 30, 45)
  const minutes = [0, 15, 30, 45];

  // Shared button style
  const glowButtonStyle = {
    backgroundColor: "transparent",
    color: "#FFFFFF",
    fontWeight: 600,
    border: "none",
    borderBottom: "2px solid #3B82F6",
    boxShadow: "0 4px 15px -3px rgba(59, 130, 246, 0.3)",
    transition: "all 200ms ease",
    cursor: "pointer",
  };

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
        <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-10 shadow-2xl pointer-events-auto">
          {/* Title */}
          <h2 className="text-2xl font-black text-center mb-4">
            When does your day end?
          </h2>
          <p className="text-text-secondary text-center text-sm mb-10">
            Set your target end time for today
          </p>

          {/* Time Picker */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {/* Hour Selector */}
            <select
              value={selectedHour}
              onChange={(e) => setSelectedHour(Number(e.target.value))}
              className="w-20 px-3 py-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-text-primary text-center font-mono text-xl appearance-none cursor-pointer focus:outline-none focus:border-accent"
              style={{ WebkitAppearance: "none", MozAppearance: "none" }}
            >
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>

            <span className="text-3xl text-text-secondary font-mono font-light">:</span>

            {/* Minute Selector */}
            <select
              value={selectedMinute}
              onChange={(e) => setSelectedMinute(Number(e.target.value))}
              className="w-20 px-3 py-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg text-text-primary text-center font-mono text-xl appearance-none cursor-pointer focus:outline-none focus:border-accent"
              style={{ WebkitAppearance: "none", MozAppearance: "none" }}
            >
              {minutes.map((min) => (
                <option key={min} value={min}>
                  {min.toString().padStart(2, "0")}
                </option>
              ))}
            </select>

            {/* AM/PM Toggle */}
            <div className="flex rounded-lg overflow-hidden border border-[#2A2A2A] ml-2">
              <button
                onClick={() => setIsPM(false)}
                className={`px-4 py-4 font-mono text-sm transition-all ${
                  !isPM
                    ? "bg-accent text-void font-semibold"
                    : "bg-[#1A1A1A] text-text-secondary hover:text-text-primary"
                }`}
              >
                AM
              </button>
              <button
                onClick={() => setIsPM(true)}
                className={`px-4 py-4 font-mono text-sm transition-all ${
                  isPM
                    ? "bg-accent text-void font-semibold"
                    : "bg-[#1A1A1A] text-text-secondary hover:text-text-primary"
                }`}
              >
                PM
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="text-center mb-10">
            <span className="text-text-secondary text-sm">Your day ends at </span>
            <span className="font-mono text-accent">
              {selectedHour}:{selectedMinute.toString().padStart(2, "0")} {isPM ? "PM" : "AM"}
            </span>
            {isNextDay() && (
              <span className="text-text-secondary text-sm"> tomorrow</span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 mt-8">
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
              style={{
                ...glowButtonStyle,
                borderBottomColor: "#4A4A4A",
                boxShadow: "0 4px 15px -3px rgba(74, 74, 74, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomWidth = "3px";
                e.currentTarget.style.boxShadow = "0 6px 20px -3px rgba(74, 74, 74, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomWidth = "2px";
                e.currentTarget.style.boxShadow = "0 4px 15px -3px rgba(74, 74, 74, 0.2)";
              }}
              className="flex-1 px-6 py-3"
            >
              Cancel
            </motion.button>
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              style={glowButtonStyle}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderBottomWidth = "3px";
                e.currentTarget.style.boxShadow = "0 6px 25px -3px rgba(59, 130, 246, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderBottomWidth = "2px";
                e.currentTarget.style.boxShadow = "0 4px 15px -3px rgba(59, 130, 246, 0.3)";
              }}
              className="flex-1 px-6 py-3 font-semibold"
            >
              Start My Day
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
