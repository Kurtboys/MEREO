"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Lock, ArrowRight } from "lucide-react";
import { useMereoStore, useCurrentSession, useMissionsByDate, useTags } from "@/lib/store";
import { getTodayDateString, formatTimeDisplay } from "@/lib/utils";
import { DraggableMissionBlock } from "./MissionBlock";

export function MissionSidebar() {
  const router = useRouter();
  const today = getTodayDateString();
  const currentSession = useCurrentSession();
  const todayMissions = useMissionsByDate(today);
  const tags = useTags();
  const { endDaySession } = useMereoStore();

  // Memoize derived values to prevent infinite re-renders
  const { hasStartedMission, regularMissions, bottleneckMissions } = useMemo(() => {
    const hasStarted = todayMissions.some(
      (m) => m.status === "active" || m.status === "completed" || m.status === "bottleneck"
    );
    const regular = todayMissions.filter((m) => m.status !== "bottleneck");
    const bottlenecks = todayMissions.filter((m) => m.status === "bottleneck");
    return { hasStartedMission: hasStarted, regularMissions: regular, bottleneckMissions: bottlenecks };
  }, [todayMissions]);

  // Handle end day
  const handleEndDay = () => {
    const brief = endDaySession();
    console.log("Executive Brief:", brief);
    router.push("/");
  };

  if (!currentSession) {
    return null;
  }

  // Safely format dates - handle both Date objects and ISO strings
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
        <h2 className="text-lg font-semibold mb-1">
          {format(new Date(), "EEEE, MMM d")}
        </h2>

        {/* Time range */}
        <p className="text-sm text-text-secondary mb-3">
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

      {/* Mission List - simplified without drag reorder for now */}
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
                  <DraggableMissionBlock
                    key={mission.id}
                    mission={mission}
                    tag={tag}
                    isActive={false}
                    isDraggable={false}
                  />
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
          className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
        >
          End Day
        </button>
      </div>
    </aside>
  );
}
