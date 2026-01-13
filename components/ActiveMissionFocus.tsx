"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Play } from "lucide-react";
import { useMereoStore, useActiveMission, useMissionsByDate, useTags } from "@/lib/store";
import { getTodayDateString, formatTimer, formatOvertime, cn } from "@/lib/utils";
import type { Checkpoint } from "@/lib/types";

export function ActiveMissionFocus() {
  const today = getTodayDateString();
  const activeMission = useActiveMission();
  const todayMissions = useMissionsByDate(today);
  const tags = useTags();
  const {
    completeCheckpoint,
    uncompleteCheckpoint,
    completeMission,
    bottleneckMission,
    setMissionActive,
  } = useMereoStore();

  // Timer state
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isOvertime, setIsOvertime] = useState(false);

  // Calculate remaining time
  const totalSeconds = activeMission
    ? activeMission.totalEstimatedMinutes * 60
    : 0;
  const remainingSeconds = totalSeconds - elapsedSeconds;

  // Get tag for active mission
  const activeTag = activeMission
    ? tags.find((t) => t.id === activeMission.tagId)
    : null;

  // Timer effect
  useEffect(() => {
    if (!activeMission?.startedAt) {
      setElapsedSeconds(0);
      setIsOvertime(false);
      return;
    }

    const startTime = new Date(activeMission.startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
      setIsOvertime(elapsed > totalSeconds);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [activeMission?.startedAt, totalSeconds]);

  // Handle checkpoint toggle
  const handleCheckpointToggle = useCallback(
    (checkpoint: Checkpoint) => {
      if (!activeMission) return;

      if (checkpoint.isComplete) {
        uncompleteCheckpoint(activeMission.id, checkpoint.id);
      } else {
        completeCheckpoint(activeMission.id, checkpoint.id);
      }
    },
    [activeMission, completeCheckpoint, uncompleteCheckpoint]
  );

  // Handle complete mission
  const handleCompleteMission = useCallback(() => {
    if (!activeMission) return;
    completeMission(activeMission.id);
  }, [activeMission, completeMission]);

  // Handle bottleneck
  const [showBottleneckModal, setShowBottleneckModal] = useState(false);

  const handleBottleneck = useCallback(
    (reason?: string) => {
      if (!activeMission) return;
      bottleneckMission(activeMission.id, reason);
      setShowBottleneckModal(false);
    },
    [activeMission, bottleneckMission]
  );

  // Handle start first mission
  const handleStartFirstMission = useCallback(() => {
    const firstMission = todayMissions.find((m) => m.status === "scheduled");
    if (firstMission) {
      setMissionActive(firstMission.id);
    }
  }, [todayMissions, setMissionActive]);

  // No active mission state
  if (!activeMission) {
    const hasScheduledMissions = todayMissions.some(
      (m) => m.status === "scheduled"
    );
    const allCompleted = todayMissions.every(
      (m) => m.status === "completed" || m.status === "bottleneck"
    );

    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md">
          {allCompleted && todayMissions.length > 0 ? (
            <>
              <div className="w-16 h-16 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-8 h-8 text-status-success" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">All Done!</h2>
              <p className="text-text-secondary mb-6">
                You've completed all your missions for today.
              </p>
            </>
          ) : hasScheduledMissions ? (
            <>
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <Play className="w-8 h-8 text-accent" />
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ready to Start</h2>
              <p className="text-text-secondary mb-6">
                You have {todayMissions.filter((m) => m.status === "scheduled").length} missions scheduled.
                Start your first mission when you're ready.
              </p>
              <button
                onClick={handleStartFirstMission}
                className="px-8 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-lg transition-colors"
              >
                Start First Mission
              </button>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-semibold mb-2 text-text-secondary">
                No Missions
              </h2>
              <p className="text-text-disabled mb-6">
                Plan your missions in the Scheduler.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Check completion status
  const completedCheckpoints = activeMission.checkpoints.filter(
    (cp) => cp.isComplete
  ).length;
  const totalCheckpoints = activeMission.checkpoints.length;
  const allCheckpointsComplete = completedCheckpoints === totalCheckpoints;

  return (
    <div className="flex-1 flex flex-col items-center p-8 overflow-auto">
      {/* Timer */}
      <div className="mb-8 text-center">
        <div
          className={cn(
            "timer-display transition-colors",
            isOvertime
              ? "text-status-warning"
              : remainingSeconds < totalSeconds * 0.25
                ? "text-status-warning animate-pulse-slow"
                : "text-text-primary"
          )}
        >
          {isOvertime
            ? formatOvertime(elapsedSeconds - totalSeconds)
            : formatTimer(remainingSeconds)}
        </div>
        <p className="text-text-secondary text-sm mt-2">
          {isOvertime ? "overtime" : "remaining"}
        </p>
      </div>

      {/* Mission Info */}
      <div className="text-center mb-8">
        {activeTag && (
          <span
            className="inline-block px-3 py-1 rounded-full text-sm font-medium mb-3"
            style={{
              backgroundColor: activeTag.color + "20",
              color: activeTag.color,
            }}
          >
            {activeTag.name}
          </span>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold mb-2">
          {activeMission.title}
        </h1>
        <p className="text-text-secondary">
          {completedCheckpoints}/{totalCheckpoints} checkpoints complete
        </p>
      </div>

      {/* Checkpoints */}
      <div className="w-full max-w-lg space-y-3 mb-8">
        <AnimatePresence mode="popLayout">
          {activeMission.checkpoints
            .sort((a, b) => a.order - b.order)
            .map((checkpoint) => (
              <motion.div
                key={checkpoint.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "flex items-center gap-4 p-4 rounded-lg transition-colors cursor-pointer",
                  checkpoint.isComplete
                    ? "bg-surface/50"
                    : "bg-surface hover:bg-surface-hover"
                )}
                onClick={() => handleCheckpointToggle(checkpoint)}
              >
                {/* Checkbox */}
                <div
                  className={cn(
                    "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors",
                    checkpoint.isComplete
                      ? "bg-status-success border-status-success"
                      : "border-border-subtle hover:border-accent"
                  )}
                >
                  {checkpoint.isComplete && (
                    <Check className="w-4 h-4 text-void" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p
                    className={cn(
                      "font-medium transition-colors",
                      checkpoint.isComplete
                        ? "text-text-disabled line-through"
                        : "text-text-primary"
                    )}
                  >
                    {checkpoint.title}
                  </p>
                </div>

                {/* Time estimate */}
                <span className="text-sm text-text-disabled font-mono">
                  {checkpoint.estimatedMinutes}m
                </span>
              </motion.div>
            ))}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {allCheckpointsComplete ? (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompleteMission}
            className="px-8 py-3 bg-status-success hover:bg-status-success/90 text-void font-semibold rounded-lg transition-colors"
          >
            Complete Mission
          </motion.button>
        ) : (
          <button
            onClick={handleCompleteMission}
            className="px-6 py-2 text-text-secondary hover:text-text-primary transition-colors"
          >
            Complete Anyway
          </button>
        )}

        <button
          onClick={() => setShowBottleneckModal(true)}
          className="px-6 py-2 text-status-bottleneck hover:text-status-bottleneck/80 transition-colors flex items-center gap-2"
        >
          <AlertTriangle className="w-4 h-4" />
          Bottleneck
        </button>
      </div>

      {/* Bottleneck Modal */}
      <AnimatePresence>
        {showBottleneckModal && (
          <BottleneckModal
            onClose={() => setShowBottleneckModal(false)}
            onConfirm={handleBottleneck}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// Bottleneck Modal
// ============================================
function BottleneckModal({
  onClose,
  onConfirm,
}: {
  onClose: () => void;
  onConfirm: (reason?: string) => void;
}) {
  const [reason, setReason] = useState("");

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-void/80 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="w-full max-w-md bg-surface border border-border-subtle rounded-2xl p-6 shadow-2xl pointer-events-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-status-bottleneck/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-status-bottleneck" />
            </div>
            <h2 className="text-xl font-semibold">Mark as Bottleneck</h2>
          </div>

          <p className="text-text-secondary mb-4">
            This mission will be moved to the end of your list and carried over
            to tomorrow.
          </p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this blocked? (optional)"
            className="w-full h-24 px-4 py-3 bg-void border border-border-subtle rounded-lg text-text-primary placeholder:text-text-disabled resize-none focus:outline-none focus:border-border-focus mb-4"
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-void border border-border-subtle text-text-primary rounded-lg hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onConfirm(reason || undefined)}
              className="flex-1 px-4 py-2 bg-status-bottleneck hover:bg-status-bottleneck/90 text-void font-semibold rounded-lg transition-colors"
            >
              Bottleneck
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
