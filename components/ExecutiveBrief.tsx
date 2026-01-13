"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Moon,
  Check,
  AlertTriangle,
  ArrowRight,
  Clock,
  X,
} from "lucide-react";
import { useMereoStore } from "@/lib/store";
import type { Mission, Tag, DaySession, ExecutiveBrief as ExecutiveBriefType } from "@/lib/types";

interface ExecutiveBriefProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// ============================================
// Utility: Generate Executive Brief Data
// ============================================
export function generateExecutiveBrief(
  session: DaySession,
  missions: Mission[],
  tags: Tag[]
): ExecutiveBriefType & { missionDetails: MissionDetail[] } {
  const sessionMissions = missions.filter((m) =>
    session.missionIds.includes(m.id)
  );

  const completedMissions = sessionMissions
    .filter((m) => m.status === "completed")
    .map((m) => ({
      missionId: m.id,
      estimatedMinutes: m.totalEstimatedMinutes,
      actualMinutes: m.actualMinutes || m.totalEstimatedMinutes,
    }));

  const bottleneckMissions = sessionMissions
    .filter((m) => m.status === "bottleneck")
    .map((m) => ({
      missionId: m.id,
      reason: m.bottleneckReason || "No reason provided",
    }));

  const incompleteMissions = sessionMissions
    .filter((m) => m.status === "scheduled" || m.status === "active")
    .map((m) => m.id);

  // Calculate time by tag
  const timeByTag: Record<string, number> = {};
  completedMissions.forEach((cm) => {
    const mission = missions.find((m) => m.id === cm.missionId);
    if (mission) {
      timeByTag[mission.tagId] =
        (timeByTag[mission.tagId] || 0) + cm.actualMinutes;
    }
  });

  // Build mission details for display
  const missionDetails: MissionDetail[] = sessionMissions.map((m) => {
    const tag = tags.find((t) => t.id === m.tagId);
    return {
      id: m.id,
      title: m.title,
      status: m.status,
      estimatedMinutes: m.totalEstimatedMinutes,
      actualMinutes: m.actualMinutes,
      bottleneckReason: m.bottleneckReason,
      tag: tag || null,
    };
  });

  return {
    sessionId: session.id,
    date: session.date,
    completedMissions,
    bottleneckMissions,
    incompleteMissions,
    totalActiveMinutes: completedMissions.reduce(
      (sum, m) => sum + m.actualMinutes,
      0
    ),
    timeByTag,
    missionDetails,
  };
}

interface MissionDetail {
  id: string;
  title: string;
  status: string;
  estimatedMinutes: number;
  actualMinutes?: number;
  bottleneckReason?: string;
  tag: Tag | null;
}

// ============================================
// Format time as Xh Ym
// ============================================
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

// ============================================
// Executive Brief Component
// ============================================
export function ExecutiveBrief({ isOpen, onClose, onConfirm }: ExecutiveBriefProps) {
  const { currentSession, missions, tags } = useMereoStore();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Generate brief data
  const briefData = useMemo(() => {
    if (!currentSession) return null;
    return generateExecutiveBrief(currentSession, missions, tags);
  }, [currentSession, missions, tags]);

  if (!isOpen || !isClient) return null;

  if (!currentSession || !briefData) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm"
        >
          <div className="text-text-secondary">No active session</div>
        </motion.div>
      </AnimatePresence>
    );
  }

  const completedDetails = briefData.missionDetails.filter(
    (m) => m.status === "completed"
  );
  const bottleneckDetails = briefData.missionDetails.filter(
    (m) => m.status === "bottleneck"
  );
  const incompleteDetails = briefData.missionDetails.filter(
    (m) => m.status === "scheduled" || m.status === "active"
  );

  // Format session times safely
  const formatTime = (date: Date | string | undefined): string => {
    if (!date) return "--:--";
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "--:--";
      return format(d, "h:mm a");
    } catch {
      return "--:--";
    }
  };

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="w-full max-w-[600px] max-h-[90vh] bg-surface border border-border-subtle rounded-2xl shadow-2xl pointer-events-auto overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border-subtle">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-accent/20 flex items-center justify-center">
                  <Moon className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Day Complete</h2>
                  <p className="text-text-secondary">
                    {format(new Date(currentSession.date), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-text-disabled">
                    {formatTime(currentSession.startTime)} - {formatTime(currentSession.endTime)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-text-disabled hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Completed Missions */}
            {completedDetails.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-status-success/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-status-success" />
                  </div>
                  <h3 className="font-semibold text-status-success">
                    Completed Missions ({completedDetails.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {completedDetails.map((mission) => {
                    const wasUnderEstimate =
                      mission.actualMinutes !== undefined &&
                      mission.actualMinutes < mission.estimatedMinutes;
                    const wasOverEstimate =
                      mission.actualMinutes !== undefined &&
                      mission.actualMinutes > mission.estimatedMinutes;

                    return (
                      <div
                        key={mission.id}
                        className="flex items-center gap-3 p-3 bg-void/50 rounded-lg"
                      >
                        {mission.tag && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: mission.tag.color + "20",
                              color: mission.tag.color,
                            }}
                          >
                            {mission.tag.name}
                          </span>
                        )}
                        <span className="flex-1 text-text-primary">
                          {mission.title}
                        </span>
                        <span
                          className={`text-sm font-mono ${
                            wasUnderEstimate
                              ? "text-status-success"
                              : wasOverEstimate
                              ? "text-status-bottleneck"
                              : "text-text-secondary"
                          }`}
                        >
                          {formatDuration(mission.actualMinutes || mission.estimatedMinutes)}
                          <span className="text-text-disabled ml-1">
                            (est {formatDuration(mission.estimatedMinutes)})
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Bottleneck Missions */}
            {bottleneckDetails.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-status-bottleneck/20 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4 text-status-bottleneck" />
                  </div>
                  <h3 className="font-semibold text-status-bottleneck">
                    Bottlenecked ({bottleneckDetails.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {bottleneckDetails.map((mission) => (
                    <div
                      key={mission.id}
                      className="p-3 bg-void/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {mission.tag && (
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: mission.tag.color + "20",
                              color: mission.tag.color,
                            }}
                          >
                            {mission.tag.name}
                          </span>
                        )}
                        <span className="flex-1 text-text-primary">
                          {mission.title}
                        </span>
                      </div>
                      {mission.bottleneckReason && (
                        <p className="text-sm text-text-secondary mt-2 pl-2 border-l-2 border-status-bottleneck/30">
                          {mission.bottleneckReason}
                        </p>
                      )}
                      <p className="text-xs text-text-disabled mt-2 flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" />
                        Moved to tomorrow
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Incomplete Missions */}
            {incompleteDetails.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-text-disabled/20 flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-text-disabled" />
                  </div>
                  <h3 className="font-semibold text-text-secondary">
                    Incomplete ({incompleteDetails.length})
                  </h3>
                </div>
                <div className="space-y-2">
                  {incompleteDetails.map((mission) => (
                    <div
                      key={mission.id}
                      className="flex items-center gap-3 p-3 bg-void/50 rounded-lg"
                    >
                      {mission.tag && (
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium opacity-60"
                          style={{
                            backgroundColor: mission.tag.color + "20",
                            color: mission.tag.color,
                          }}
                        >
                          {mission.tag.name}
                        </span>
                      )}
                      <span className="flex-1 text-text-secondary">
                        {mission.title}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-text-disabled mt-2 flex items-center gap-1">
                  <ArrowRight className="w-3 h-3" />
                  Moved to first slots tomorrow
                </p>
              </section>
            )}

            {/* Time Summary */}
            <section className="pt-4 border-t border-border-subtle">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-accent" />
                </div>
                <h3 className="font-semibold">Time Summary</h3>
              </div>

              {/* Total active time */}
              <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg mb-3">
                <span className="text-text-primary font-medium">
                  Total Active Time
                </span>
                <span className="text-xl font-bold text-accent">
                  {formatDuration(briefData.totalActiveMinutes)}
                </span>
              </div>

              {/* Breakdown by tag */}
              {Object.keys(briefData.timeByTag).length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-text-disabled uppercase tracking-wide">
                    By Category
                  </p>
                  {Object.entries(briefData.timeByTag).map(([tagId, minutes]) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <div
                        key={tagId}
                        className="flex items-center justify-between p-2 bg-void/30 rounded-lg"
                      >
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                        <span className="font-mono text-text-secondary">
                          {formatDuration(minutes)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Empty state */}
            {completedDetails.length === 0 &&
              bottleneckDetails.length === 0 &&
              incompleteDetails.length === 0 && (
                <div className="text-center py-8 text-text-disabled">
                  No missions were scheduled for today.
                </div>
              )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border-subtle">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onConfirm}
              className="w-full px-6 py-4 bg-accent hover:bg-accent-hover text-void font-semibold text-lg rounded-xl transition-colors"
            >
              Close & Logout
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
