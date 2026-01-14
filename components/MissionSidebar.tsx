"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString } from "@/lib/utils";
import { DraggableMissionBlock } from "./MissionBlock";
import { ExecutiveBrief } from "./ExecutiveBrief";

// Format date in casual style: "Jan 14th, 2026"
function formatCasualDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = date.getDate();
  const suffix = getDaySuffix(day);
  return months[date.getMonth()] + " " + day + suffix + ", " + date.getFullYear();
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

export function MissionSidebar() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showBrief, setShowBrief] = useState(false);
  const { currentSession, missions, tags, endDaySession, carryOverIncompleteMissions } = useMereoStore();

  // Only render on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  const today = getTodayDateString();

  // Memoize derived values to prevent re-render issues
  const { todayMissions, hasStartedMission, regularMissions, bottleneckMissions } = useMemo(() => {
    const todayM = missions
      .filter((m) => m.scheduledDate === today)
      .sort((a, b) => a.order - b.order);

    const hasStarted = todayM.some(
      (m) => m.status === "active" || m.status === "completed" || m.status === "bottleneck"
    );
    const regular = todayM.filter((m) => m.status !== "bottleneck");
    const bottlenecks = todayM.filter((m) => m.status === "bottleneck");

    return {
      todayMissions: todayM,
      hasStartedMission: hasStarted,
      regularMissions: regular,
      bottleneckMissions: bottlenecks
    };
  }, [missions, today]);

  // Handle end day - show executive brief
  const handleEndDay = () => {
    setShowBrief(true);
  };

  // Handle confirm end day - actually end session and navigate
  const handleConfirmEndDay = () => {
    const brief = endDaySession();
    console.log("Executive Brief:", brief);
    carryOverIncompleteMissions();
    setShowBrief(false);
    router.push("/");
  };

  // Show nothing until client-side
  if (!isClient || !currentSession) {
    return (
      <aside className="w-[280px] h-full bg-surface border-r border-border-subtle flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </aside>
    );
  }

  return (
    <aside className="w-[280px] h-full bg-surface border-r border-border-subtle flex flex-col">
      {/* Header */}
      <div className="px-6 py-8 border-b border-border-subtle space-y-6">
        {/* Mission Queue Label */}
        <p className="text-xs font-mono font-light text-text-disabled uppercase tracking-[0.2em]">
          MISSION QUEUE
        </p>

        {/* Date - Casual Format */}
        <h2 className="text-xl font-black tracking-tight">
          {formatCasualDate(new Date())}
        </h2>

        {/* Whiteboard link */}
        <Link
          href="/whiteboard"
          className="flex items-center gap-2 text-sm text-accent hover:text-accent-hover transition-colors"
        >
          Open Whiteboard
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Reorder lock indicator */}
      {hasStartedMission && (
        <div className="px-4 py-2 bg-void/50 flex items-center gap-2 text-xs text-text-disabled">
          <Lock className="w-3 h-3" />
          <span>Order locked after first mission</span>
        </div>
      )}

      {/* Mission List */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {regularMissions.map((mission) => {
              const tag = tags.find((t) => t.id === mission.tagId);
              const isActive = mission.status === "active";

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  layout
                >
                  <DraggableMissionBlock
                    mission={mission}
                    tag={tag}
                    isActive={isActive}
                    isDraggable={false}
                  />
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Bottleneck missions at bottom */}
        {bottleneckMissions.length > 0 && (
          <div className="mt-6 pt-4 border-t border-border-subtle">
            <p className="text-xs text-text-disabled uppercase tracking-wide mb-3">
              Bottlenecked
            </p>
            <div className="space-y-3">
              {bottleneckMissions.map((mission) => {
                const tag = tags.find((t) => t.id === mission.tagId);
                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <DraggableMissionBlock
                      mission={mission}
                      tag={tag}
                      isActive={false}
                      isDraggable={false}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-auto px-6 py-6 border-t border-border-subtle">
        <button
          onClick={handleEndDay}
          className="w-full px-6 py-3 text-lg font-black text-text-primary bg-transparent border-b-2 border-accent hover:border-b-[3px] transition-all duration-200"
          style={{
            boxShadow: "0 4px 15px -3px rgba(59, 130, 246, 0.2)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 6px 20px -3px rgba(59, 130, 246, 0.4)";
            e.currentTarget.style.textShadow = "0 0 15px rgba(59, 130, 246, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 15px -3px rgba(59, 130, 246, 0.2)";
            e.currentTarget.style.textShadow = "none";
          }}
        >
          Clock Out
        </button>
      </div>

      {/* Executive Brief Modal */}
      <ExecutiveBrief
        isOpen={showBrief}
        onClose={() => setShowBrief(false)}
        onConfirm={handleConfirmEndDay}
      />
    </aside>
  );
}
