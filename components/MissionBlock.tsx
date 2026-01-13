"use client";

import { motion } from "framer-motion";
import { Check, Lock, GripVertical, AlertTriangle } from "lucide-react";
import type { Mission, Tag } from "@/lib/types";
import { formatTime, cn } from "@/lib/utils";

interface MissionBlockProps {
  mission: Mission;
  tag?: Tag;
  isActive: boolean;
  isDraggable: boolean;
  onSelect?: () => void;
}

export function MissionBlock({
  mission,
  tag,
  isActive,
  isDraggable,
  onSelect,
}: MissionBlockProps) {
  const { status, title, totalEstimatedMinutes, checkpoints } = mission;

  // Determine which variant to render
  if (status === "bottleneck") {
    return <BottleneckBlock />;
  }

  if (status === "completed") {
    return (
      <CompletedBlock
        title={title}
        tagColor={tag?.color}
        checkpointsCompleted={checkpoints.filter((cp) => cp.isComplete).length}
        totalCheckpoints={checkpoints.length}
      />
    );
  }

  if (status === "active" || isActive) {
    return (
      <ActiveBlock
        title={title}
        tag={tag}
        totalMinutes={totalEstimatedMinutes}
        checkpointsCompleted={checkpoints.filter((cp) => cp.isComplete).length}
        totalCheckpoints={checkpoints.length}
        onSelect={onSelect}
      />
    );
  }

  // Upcoming/scheduled - show minimal info
  return (
    <UpcomingBlock
      tagName={tag?.name}
      tagColor={tag?.color}
      totalMinutes={totalEstimatedMinutes}
      isDraggable={isDraggable}
    />
  );
}

// ============================================
// Completed Mission Block
// ============================================
function CompletedBlock({
  title,
  tagColor,
  checkpointsCompleted,
  totalCheckpoints,
}: {
  title: string;
  tagColor?: string;
  checkpointsCompleted: number;
  totalCheckpoints: number;
}) {
  return (
    <div
      className="relative rounded-lg bg-surface/50 p-4 border-l-4 opacity-60"
      style={{ borderColor: tagColor || "#2A2A2A" }}
    >
      {/* Checkmark overlay */}
      <div className="absolute top-3 right-3">
        <div className="w-6 h-6 rounded-full bg-status-success/20 flex items-center justify-center">
          <Check className="w-4 h-4 text-status-success" />
        </div>
      </div>

      <p className="text-sm text-text-secondary line-through pr-8">{title}</p>
      <p className="text-xs text-text-disabled mt-1">
        {checkpointsCompleted}/{totalCheckpoints} completed
      </p>
    </div>
  );
}

// ============================================
// Active Mission Block
// ============================================
function ActiveBlock({
  title,
  tag,
  totalMinutes,
  checkpointsCompleted,
  totalCheckpoints,
  onSelect,
}: {
  title: string;
  tag?: Tag;
  totalMinutes: number;
  checkpointsCompleted: number;
  totalCheckpoints: number;
  onSelect?: () => void;
}) {
  return (
    <motion.div
      layoutId="active-mission"
      onClick={onSelect}
      className={cn(
        "relative rounded-lg bg-surface p-4 cursor-pointer",
        "border-l-4 border-accent",
        "shadow-lg shadow-accent/10",
        "ring-1 ring-accent/30"
      )}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.2 }}
    >
      {/* Active indicator */}
      <div className="flex items-center gap-2 mb-2">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <span className="text-xs font-medium text-accent uppercase tracking-wide">
          Active
        </span>
      </div>

      {/* Tag badge */}
      {tag && (
        <span
          className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
          style={{
            backgroundColor: tag.color + "20",
            color: tag.color,
          }}
        >
          {tag.name}
        </span>
      )}

      {/* Title */}
      <h3 className="font-semibold text-text-primary mb-2">{title}</h3>

      {/* Progress */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          {checkpointsCompleted}/{totalCheckpoints} done
        </span>
        <span className="text-text-secondary font-mono">
          {formatTime(totalMinutes)}
        </span>
      </div>
    </motion.div>
  );
}

// ============================================
// Upcoming Mission Block (Locked - No Title)
// ============================================
function UpcomingBlock({
  tagName,
  tagColor,
  totalMinutes,
  isDraggable,
}: {
  tagName?: string;
  tagColor?: string;
  totalMinutes: number;
  isDraggable: boolean;
}) {
  return (
    <div
      className={cn(
        "relative rounded-lg bg-surface p-4 border-l-4",
        isDraggable && "cursor-grab active:cursor-grabbing"
      )}
      style={{ borderColor: tagColor || "#2A2A2A" }}
    >
      {/* Drag handle or lock */}
      <div className="absolute top-3 right-3">
        {isDraggable ? (
          <GripVertical className="w-4 h-4 text-text-disabled" />
        ) : (
          <Lock className="w-4 h-4 text-text-disabled" />
        )}
      </div>

      {/* Tag color block with name */}
      <div className="flex items-center gap-3">
        <div
          className="w-3 h-12 rounded-sm"
          style={{ backgroundColor: tagColor || "#3B82F6" }}
        />
        <div>
          <p className="text-sm text-text-secondary">
            {tagName || "Untagged"}
          </p>
          <p className="text-xs text-text-disabled font-mono mt-1">
            {formatTime(totalMinutes)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Bottleneck Mission Block
// ============================================
function BottleneckBlock() {
  return (
    <div className="relative rounded-lg bg-status-bottleneck/20 border border-status-bottleneck/30 p-4 overflow-hidden">
      {/* Warning icon */}
      <div className="absolute top-3 right-3">
        <AlertTriangle className="w-5 h-5 text-status-bottleneck" />
      </div>

      {/* Large rotated text */}
      <div className="flex items-center justify-center h-16">
        <span className="text-status-bottleneck font-bold text-lg tracking-widest uppercase">
          BOTTLENECK
        </span>
      </div>
    </div>
  );
}

// ============================================
// Draggable wrapper for reorder
// ============================================
export function DraggableMissionBlock({
  mission,
  tag,
  isActive,
  isDraggable,
  onSelect,
}: MissionBlockProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
    >
      <MissionBlock
        mission={mission}
        tag={tag}
        isActive={isActive}
        isDraggable={isDraggable}
        onSelect={onSelect}
      />
    </motion.div>
  );
}
