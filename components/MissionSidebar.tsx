"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Lock, ArrowRight } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString, formatTimeDisplay } from "@/lib/utils";
import { DraggableMissionBlock } from "./MissionBlock";
import { ExecutiveBrief } from "./ExecutiveBrief";

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

  // Safely format dates
  const formatSessionTime = (time: Date | string | undefined): string => {
    if (!time) return "--:--";
    try {
      const date = typeof time === "string" ? new Date(time) : time;
      if (isNaN(date.getTime())) return "--:--";
      return formatTimeDisplay(date);
    } catch {
      return "--:--";
    }
  };

  return (
    <aside className="w-[280px] h-full bg-surface border-r border-border-subtle flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        {/* Date */}
        <h2 className="text-lg font-black mb-1">
          {format(new Date(), "EEEE, MMM d")}
        </h2>

        {/* Time range */}
        <p className="text-sm text-text-secondary font-mono font-light mb-3">
          {formatSessionTime(currentSession.startTime)} -{" "}
          {formatSessionTime(currentSession.endTime)}
        </p>

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
      <div className="flex-1 overflow-y-auto p-4">
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
      <div className="p-4 border-t border-border-subtle">
        <button
          onClick={handleEndDay}
          className="w-full px-4 py-2 text-sm text-text-secondary border border-border-subtle hover:text-text-primary hover:bg-surface-hover hover:border-text-disabled rounded-lg transition-all duration-200"
        >
          End Day
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
