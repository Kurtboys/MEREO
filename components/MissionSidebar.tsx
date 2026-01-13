"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, Reorder, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Lock, ArrowRight } from "lucide-react";
import { useMereoStore, useCurrentSession, useMissionsByDate, useTags } from "@/lib/store";
import { getTodayDateString, formatTimeDisplay } from "@/lib/utils";
import { DraggableMissionBlock } from "./MissionBlock";
import type { Mission } from "@/lib/types";

export function MissionSidebar() {
  const router = useRouter();
  const today = getTodayDateString();
  const currentSession = useCurrentSession();
  const todayMissions = useMissionsByDate(today);
  const tags = useTags();
  const { reorderMissions, endDaySession } = useMereoStore();

  // Local state for reorder (to enable smooth dragging)
  const [localMissions, setLocalMissions] = useState<Mission[]>(todayMissions);

  // Check if any mission has been started
  const hasStartedMission = todayMissions.some(
    (m) => m.status === "active" || m.status === "completed" || m.status === "bottleneck"
  );

  // Can only reorder if no mission has been started
  const canReorder = !hasStartedMission;

  // Get active mission
  const activeMission = todayMissions.find((m) => m.status === "active");

  // Separate bottleneck missions (show at bottom)
  const bottleneckMissions = todayMissions.filter((m) => m.status === "bottleneck");
  const regularMissions = todayMissions.filter((m) => m.status !== "bottleneck");

  // Handle reorder
  const handleReorder = useCallback(
    (reorderedMissions: Mission[]) => {
      setLocalMissions(reorderedMissions);
      // Update store with new order
      const missionIds = reorderedMissions.map((m) => m.id);
      reorderMissions(today, missionIds);
    },
    [reorderMissions, today]
  );

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
      {!canReorder && (
        <div className="px-4 py-2 bg-void/50 flex items-center gap-2 text-xs text-text-disabled">
          <Lock className="w-3 h-3" />
          <span>Order locked after first mission</span>
        </div>
      )}

      {/* Mission List */}
      <div className="flex-1 overflow-y-auto p-4">
        {canReorder ? (
          // Draggable list
          <Reorder.Group
            axis="y"
            values={regularMissions}
            onReorder={handleReorder}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {regularMissions.map((mission) => {
                const tag = tags.find((t) => t.id === mission.tagId);
                const isActive = mission.status === "active";

                return (
                  <Reorder.Item
                    key={mission.id}
                    value={mission}
                    className="cursor-grab active:cursor-grabbing"
                    whileDrag={{
                      scale: 1.02,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                    }}
                  >
                    <DraggableMissionBlock
                      mission={mission}
                      tag={tag}
                      isActive={isActive}
                      isDraggable={canReorder}
                    />
                  </Reorder.Item>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          // Static list (no dragging)
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {regularMissions.map((mission) => {
                const tag = tags.find((t) => t.id === mission.tagId);
                const isActive = mission.status === "active";

                return (
                  <DraggableMissionBlock
                    key={mission.id}
                    mission={mission}
                    tag={tag}
                    isActive={isActive}
                    isDraggable={false}
                  />
                );
              })}
            </AnimatePresence>
          </div>
        )}

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

        {/* Empty state */}
        {todayMissions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-disabled text-sm mb-4">
              No missions scheduled
            </p>
            <Link
              href="/scheduler"
              className="text-accent text-sm hover:text-accent-hover transition-colors"
            >
              Plan your day &rarr;
            </Link>
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
