"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, AlertTriangle, Play, Clock, Sparkles } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { getTodayDateString, cn } from "@/lib/utils";
import { Timer } from "./Timer";
import { BottleneckModal } from "./BottleneckModal";
import type { Checkpoint } from "@/lib/types";

export function MissionFocus() {
  const [isClient, setIsClient] = useState(false);
  const [showBottleneckModal, setShowBottleneckModal] = useState(false);
  const [showCompleteCelebration, setShowCompleteCelebration] = useState(false);
  const [completedMissionTitle, setCompletedMissionTitle] = useState("");
  const prevMissionIdRef = useRef<string | null>(null);
  const today = getTodayDateString();
  const { missionComplete, checkpointComplete } = useToast();

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

  // Track mission changes for transition animation
  useEffect(() => {
    const currentId = activeMission?.id || null;
    // If we had a mission and now have a different one, it transitioned
    if (prevMissionIdRef.current && currentId !== prevMissionIdRef.current) {
      // Mission changed - the celebration was already shown in handleCompleteMission
    }
    prevMissionIdRef.current = currentId;
  }, [activeMission?.id]);

  // Handle checkpoint toggle with animation
  const handleCheckpointToggle = useCallback(
    (checkpoint: Checkpoint) => {
      if (!activeMission) return;

      if (checkpoint.isComplete) {
        uncompleteCheckpoint(activeMission.id, checkpoint.id);
      } else {
        completeCheckpoint(activeMission.id, checkpoint.id);
        checkpointComplete(checkpoint.title);
      }
    },
    [activeMission, completeCheckpoint, uncompleteCheckpoint, checkpointComplete]
  );

  // Handle complete mission with celebration
  const handleCompleteMission = useCallback(() => {
    if (!activeMission) return;

    const title = activeMission.title;

    // Show celebration briefly
    setCompletedMissionTitle(title);
    setShowCompleteCelebration(true);

    // Complete mission after brief delay to show celebration
    setTimeout(() => {
      completeMission(activeMission.id);
      missionComplete(title);
      // Hide celebration after another moment
      setTimeout(() => {
        setShowCompleteCelebration(false);
      }, 300);
    }, 600);
  }, [activeMission, completeMission, missionComplete]);

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
    const allCompleted = todayMissions.length > 0 && todayMissions.every(
      (m) => m.status === "completed"
    );
    const allBottlenecked = todayMissions.length > 0 && todayMissions.every(
      (m) => m.status === "bottleneck"
    );
    const someCompleted = todayMissions.some((m) => m.status === "completed");
    const someBottlenecked = todayMissions.some((m) => m.status === "bottleneck");
    const allFinished = todayMissions.length > 0 && todayMissions.every(
      (m) => m.status === "completed" || m.status === "bottleneck"
    );

    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-center max-w-md">
          {allCompleted ? (
            // All missions completed
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
          ) : allBottlenecked ? (
            // All missions bottlenecked
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 rounded-full bg-status-bottleneck/20 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-10 h-10 text-status-bottleneck" />
              </div>
              <h2 className="text-3xl font-semibold mb-3 text-status-bottleneck">All Blocked</h2>
              <p className="text-text-secondary text-lg">
                All {todayMissions.length} mission{todayMissions.length !== 1 ? "s" : ""} hit bottlenecks.
                <br />
                <span className="text-text-disabled">They&apos;ll carry over to tomorrow.</span>
              </p>
            </motion.div>
          ) : allFinished && someCompleted && someBottlenecked ? (
            // Mixed: some completed, some bottlenecked
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-status-success" />
              </div>
              <h2 className="text-3xl font-semibold mb-3">Day Complete</h2>
              <p className="text-text-secondary text-lg">
                {todayMissions.filter((m) => m.status === "completed").length} completed, {todayMissions.filter((m) => m.status === "bottleneck").length} bottlenecked.
              </p>
            </motion.div>
          ) : hasScheduledMissions ? (
            // Has scheduled missions - show start button
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
            // No missions at all
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
      <BottleneckModal
        isOpen={showBottleneckModal}
        missionTitle={activeMission.title}
        onClose={() => setShowBottleneckModal(false)}
        onConfirm={handleBottleneck}
      />

      {/* Mission Complete Celebration Overlay */}
      <AnimatePresence>
        {showCompleteCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-void/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                transition={{ delay: 0.1, duration: 0.4 }}
                className="w-24 h-24 rounded-full bg-status-success/30 flex items-center justify-center mx-auto mb-6"
              >
                <Sparkles className="w-12 h-12 text-status-success" />
              </motion.div>
              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold text-status-success mb-2"
              >
                Mission Complete!
              </motion.h2>
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-text-secondary text-lg"
              >
                {completedMissionTitle}
              </motion.p>
            </motion.div>
          </motion.div>
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
