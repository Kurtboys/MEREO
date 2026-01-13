"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Play } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString, cn } from "@/lib/utils";
import { Timer } from "./Timer";
import type { Checkpoint, Tag } from "@/lib/types";

export function MissionFocus() {
  const [isClient, setIsClient] = useState(false);
  const [showBottleneckModal, setShowBottleneckModal] = useState(false);
  const today = getTodayDateString();

  const {
    missions,
    tags,
    completeCheckpoint,
    uncompleteCheckpoint,
    completeMission,
    bottleneckMission,
    setMissionActive,
  } = useMereoStore();

  // Only render on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize derived values
  const { activeMission, todayMissions, activeTag } = useMemo(() => {
    const todayM = missions
      .filter((m) => m.scheduledDate === today)
      .sort((a, b) => a.order - b.order);
    const active = missions.find((m) => m.status === "active");
    const tag = active ? tags.find((t) => t.id === active.tagId) : null;
    return { activeMission: active, todayMissions: todayM, activeTag: tag };
  }, [missions, tags, today]);

  // Handle checkpoint toggle with animation
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

  // Loading state
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No active mission state
  if (!activeMission) {
    const hasScheduledMissions = todayMissions.some((m) => m.status === "scheduled");
    const allCompleted = todayMissions.every(
      (m) => m.status === "completed" || m.status === "bottleneck"
    );

    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          {allCompleted && todayMissions.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-status-success" />
              </div>
              <h2 className="text-3xl font-semibold mb-3">All Done!</h2>
              <p className="text-text-secondary text-lg">
                You&apos;ve completed all your missions for today.
              </p>
            </motion.div>
          ) : hasScheduledMissions ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
                <Play className="w-10 h-10 text-accent ml-1" />
              </div>
              <h2 className="text-3xl font-semibold mb-3">Ready to Start</h2>
              <p className="text-text-secondary text-lg mb-8">
                You have {todayMissions.filter((m) => m.status === "scheduled").length} mission
                {todayMissions.filter((m) => m.status === "scheduled").length !== 1 ? "s" : ""} scheduled.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartFirstMission}
                className="px-10 py-4 bg-accent hover:bg-accent-hover text-void font-semibold text-lg rounded-xl transition-colors shadow-lg shadow-accent/20"
              >
                Start First Mission
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-semibold mb-3 text-text-secondary">
                No Missions Scheduled
              </h2>
              <p className="text-text-disabled">
                Plan your missions in the Scheduler.
              </p>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  // Active mission state
  const completedCheckpoints = activeMission.checkpoints.filter((cp) => cp.isComplete).length;
  const totalCheckpoints = activeMission.checkpoints.length;
  const allCheckpointsComplete = completedCheckpoints === totalCheckpoints && totalCheckpoints > 0;

  return (
    <div className="flex-1 flex flex-col items-center p-12 overflow-auto">
      {/* Timer */}
      <Timer
        startedAt={activeMission.startedAt}
        totalMinutes={activeMission.totalEstimatedMinutes}
        className="mb-10"
      />

      {/* Mission Info */}
      <div className="text-center mb-10">
        <div className="flex items-center justify-center gap-3 mb-3">
          <h1 className="text-[28px] font-semibold">{activeMission.title}</h1>
          {activeTag && (
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: activeTag.color + "20",
                color: activeTag.color,
              }}
            >
              {activeTag.name}
            </span>
          )}
        </div>
        <p className="text-text-secondary">
          {completedCheckpoints} of {totalCheckpoints} complete
        </p>
      </div>

      {/* Checkpoints List */}
      <div className="w-full max-w-xl space-y-3 mb-10">
        <AnimatePresence mode="popLayout">
          {activeMission.checkpoints
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((checkpoint) => (
              <CheckpointItem
                key={checkpoint.id}
                checkpoint={checkpoint}
                onToggle={() => handleCheckpointToggle(checkpoint)}
              />
            ))}
        </AnimatePresence>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-6 mt-auto">
        {allCheckpointsComplete ? (
          <motion.button
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleCompleteMission}
            className="px-10 py-4 bg-status-success hover:bg-status-success/90 text-void font-semibold text-lg rounded-xl transition-colors shadow-lg shadow-status-success/20"
          >
            Complete Mission
          </motion.button>
        ) : (
          <button
            onClick={handleCompleteMission}
            className="px-8 py-3 border border-border-subtle text-text-secondary hover:text-text-primary hover:border-text-secondary rounded-xl transition-colors"
          >
            Complete Anyway
          </button>
        )}

        <button
          onClick={() => setShowBottleneckModal(true)}
          className="px-6 py-3 border border-status-bottleneck/50 text-status-bottleneck hover:bg-status-bottleneck/10 rounded-xl transition-colors flex items-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" />
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
// Checkpoint Item Component
// ============================================
function CheckpointItem({
  checkpoint,
  onToggle,
}: {
  checkpoint: Checkpoint;
  onToggle: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl transition-colors cursor-pointer group",
        checkpoint.isComplete
          ? "bg-surface/50"
          : "bg-surface hover:bg-surface-hover"
      )}
      onClick={onToggle}
    >
      {/* Custom Checkbox */}
      <motion.div
        whileTap={{ scale: 0.85 }}
        className={cn(
          "w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all",
          checkpoint.isComplete
            ? "bg-accent border-accent"
            : "border-border-subtle group-hover:border-accent"
        )}
      >
        <AnimatePresence mode="wait">
          {checkpoint.isComplete && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <Check className="w-4 h-4 text-void" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Checkpoint Title */}
      <div className="flex-1">
        <motion.p
          className={cn(
            "text-base font-medium transition-colors",
            checkpoint.isComplete
              ? "text-text-disabled"
              : "text-text-primary"
          )}
          animate={{
            textDecoration: checkpoint.isComplete ? "line-through" : "none",
          }}
          transition={{ duration: 0.2 }}
        >
          {checkpoint.title}
        </motion.p>
      </div>

      {/* Time Estimate */}
      <span className="text-sm text-text-disabled font-mono">
        {checkpoint.estimatedMinutes} min
      </span>
    </motion.div>
  );
}

// ============================================
// Bottleneck Modal Component
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
            <div className="w-12 h-12 rounded-full bg-status-bottleneck/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-status-bottleneck" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Mark as Bottleneck</h2>
              <p className="text-sm text-text-secondary">Move to end of list</p>
            </div>
          </div>

          <p className="text-text-secondary mb-4">
            This mission will be carried over to tomorrow. What&apos;s blocking you?
          </p>

          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Waiting on client feedback, need more research..."
            className="w-full h-28 px-4 py-3 bg-void border border-border-subtle rounded-xl text-text-primary placeholder:text-text-disabled resize-none focus:outline-none focus:border-accent transition-colors mb-5"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-5 py-3 bg-void border border-border-subtle text-text-primary rounded-xl hover:bg-surface-hover transition-colors"
            >
              Cancel
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onConfirm(reason || undefined)}
              className="flex-1 px-5 py-3 bg-status-bottleneck hover:bg-status-bottleneck/90 text-void font-semibold rounded-xl transition-colors"
            >
              Mark Bottleneck
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
