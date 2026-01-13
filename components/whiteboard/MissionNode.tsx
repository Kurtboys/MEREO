"use client";

import { memo, useState, useEffect } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { motion } from "framer-motion";
import { Check, AlertTriangle, Lock, Play, Clock } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Mission, Tag, MissionStatus } from "@/lib/types";

export interface MissionNodeData extends Record<string, unknown> {
  missionId: string;
  // Fallback data for when store isn't available
  label?: string;
  status?: MissionStatus;
  tagColor?: string;
  tagName?: string;
  totalMinutes?: number;
  checkpointCount?: number;
  completedCheckpoints?: number;
  // Animation triggers
  triggerUnlock?: boolean;
}

type MissionNodeType = Node<MissionNodeData, "mission">;

function MissionNodeComponent({ data, selected }: NodeProps<MissionNodeType>) {
  const {
    getMissionById,
    getTagById,
    setMissionActive,
    completeMission,
    bottleneckMission,
  } = useMereoStore();

  // Timer state for active mission
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  // Unlock animation state
  const [showUnlockAnimation, setShowUnlockAnimation] = useState(false);

  // Trigger unlock animation when prop changes
  useEffect(() => {
    if (data.triggerUnlock) {
      setShowUnlockAnimation(true);
      const timer = setTimeout(() => setShowUnlockAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [data.triggerUnlock]);

  // Get mission from store
  const mission = data.missionId ? getMissionById(data.missionId) : null;
  const tag = mission?.tagId ? getTagById(mission.tagId) : null;

  // Use store data or fallback to node data
  const missionData = mission || {
    id: data.missionId || "unknown",
    title: data.label || "Unknown Mission",
    status: data.status || "scheduled",
    totalEstimatedMinutes: data.totalMinutes || 0,
    checkpoints: [],
    startedAt: undefined,
  };

  const tagData = tag || {
    color: data.tagColor || "#3B82F6",
    name: data.tagName || "Untagged",
  };

  const checkpointCount = mission?.checkpoints.length || data.checkpointCount || 0;
  const completedCheckpoints = mission?.checkpoints.filter((c) => c.isComplete).length ||
    data.completedCheckpoints || 0;
  const allCheckpointsComplete = checkpointCount > 0 && completedCheckpoints === checkpointCount;

  const status = missionData.status as MissionStatus;
  const isActive = status === "active";
  const isComplete = status === "completed";
  const isBottleneck = status === "bottleneck";
  const isLocked = status === "scheduled" && !isActive;

  // Timer effect for active mission
  useEffect(() => {
    if (!isActive || !mission?.startedAt) {
      setElapsedSeconds(0);
      return;
    }

    const startTime = new Date(mission.startedAt).getTime();

    const updateTimer = () => {
      const now = Date.now();
      setElapsedSeconds(Math.floor((now - startTime) / 1000));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [isActive, mission?.startedAt]);

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle actions
  const handleSetActive = () => {
    if (mission && status === "scheduled") {
      setMissionActive(mission.id);
    }
  };

  const handleComplete = () => {
    if (mission && isActive && allCheckpointsComplete) {
      completeMission(mission.id);
    }
  };

  const handleBottleneck = () => {
    if (mission && isActive) {
      bottleneckMission(mission.id);
    }
  };

  return (
    <>
      {/* Target Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-surface !border-2 !border-text-disabled hover:!border-accent transition-colors"
      />

      {/* Mission Card */}
      <motion.div
        initial={false}
        animate={{
          boxShadow: showUnlockAnimation
            ? `0 0 30px ${tagData.color}80, 0 0 60px ${tagData.color}40`
            : isActive
            ? `0 0 20px ${tagData.color}40, 0 0 40px ${tagData.color}20`
            : "none",
          scale: showUnlockAnimation ? 1.02 : 1,
        }}
        transition={{
          boxShadow: { duration: 0.3 },
          scale: { duration: 0.3, ease: "easeOut" },
        }}
        className={cn(
          "w-[220px] rounded-lg overflow-hidden transition-all",
          isComplete && "opacity-60",
          isBottleneck && "ring-2 ring-status-bottleneck",
          isActive && "ring-2 ring-accent",
          selected && "ring-2 ring-white ring-offset-2 ring-offset-void"
        )}
        style={{
          backgroundColor: "#141414",
          borderLeft: `4px solid ${tagData.color}`,
        }}
      >
        {/* Content */}
        <div className="p-4">
          {/* Tag Badge */}
          <div
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mb-2"
            style={{
              backgroundColor: `${tagData.color}20`,
              color: tagData.color,
            }}
          >
            {tagData.name}
          </div>

          {/* Mission Title */}
          <h3
            className={cn(
              "text-base font-semibold leading-tight mb-3",
              isComplete ? "text-text-disabled line-through" : "text-text-primary"
            )}
          >
            {missionData.title}
          </h3>

          {/* Divider */}
          <div className="border-t border-border-subtle mb-3" />

          {/* Stats Row */}
          <div className="flex items-center gap-2 text-xs text-text-secondary mb-3">
            <span>{missionData.totalEstimatedMinutes} min</span>
            <span className="text-text-disabled">|</span>
            <span>
              {completedCheckpoints}/{checkpointCount} checkpoints
            </span>
          </div>

          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            {isActive && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                Active
              </span>
            )}
            {isLocked && (
              <motion.span
                initial={false}
                animate={{
                  opacity: showUnlockAnimation ? 0 : 1,
                }}
                transition={{ duration: 0.3 }}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-text-disabled"
              >
                <motion.div
                  animate={{
                    scale: showUnlockAnimation ? 0.5 : 1,
                    rotate: showUnlockAnimation ? 45 : 0,
                  }}
                  transition={{ duration: 0.3 }}
                >
                  <Lock className="w-3 h-3" />
                </motion.div>
                Locked
              </motion.span>
            )}
            {isComplete && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-complete">
                <Check className="w-3 h-3" />
                Complete
              </span>
            )}
            {isBottleneck && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-status-bottleneck">
                <AlertTriangle className="w-3 h-3" />
                Blocked
              </span>
            )}
          </div>

          {/* Active State Extras */}
          {isActive && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              {/* Mini Timer */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-accent">
                  <Clock className="w-4 h-4" />
                  <span className="text-lg font-mono font-bold">
                    {formatTime(elapsedSeconds)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {allCheckpointsComplete && (
                  <button
                    onClick={handleComplete}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-status-complete/20 hover:bg-status-complete/30 text-status-complete text-xs font-medium rounded transition-colors"
                  >
                    <Check className="w-3 h-3" />
                    Complete
                  </button>
                )}
                <button
                  onClick={handleBottleneck}
                  className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-status-bottleneck/20 hover:bg-status-bottleneck/30 text-status-bottleneck text-xs font-medium rounded transition-colors"
                >
                  <AlertTriangle className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Start Button for Locked Missions */}
          {isLocked && (
            <div className="mt-3 pt-3 border-t border-border-subtle">
              <button
                onClick={handleSetActive}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-accent/20 hover:bg-accent/30 text-accent text-xs font-medium rounded transition-colors"
              >
                <Play className="w-3 h-3" />
                Start Mission
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Source Handle - Bottom (for connection to next mission) */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="mission-out"
        className="!w-3 !h-3 !bg-surface !border-2 !border-text-disabled hover:!border-accent transition-colors"
      />

      {/* Additional Source Handles for Checkpoints */}
      {checkpointCount > 0 && (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="checkpoint-out-left"
            style={{ left: "25%" }}
            className="!w-2 !h-2 !bg-surface !border-2 !border-text-secondary hover:!border-accent transition-colors"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="checkpoint-out-right"
            style={{ left: "75%" }}
            className="!w-2 !h-2 !bg-surface !border-2 !border-text-secondary hover:!border-accent transition-colors"
          />
        </>
      )}
    </>
  );
}

export const MissionNode = memo(MissionNodeComponent);
