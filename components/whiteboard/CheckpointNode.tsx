"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { motion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Checkpoint } from "@/lib/types";

export interface CheckpointNodeData extends Record<string, unknown> {
  missionId: string;
  checkpointId: string;
  // Fallback data
  label?: string;
  estimatedMinutes?: number;
  isComplete?: boolean;
}

type CheckpointNodeType = Node<CheckpointNodeData, "checkpoint">;

function CheckpointNodeComponent({ data, selected }: NodeProps<CheckpointNodeType>) {
  const { getMissionById, completeCheckpoint, uncompleteCheckpoint } = useMereoStore();

  // Get checkpoint from store
  const mission = data.missionId ? getMissionById(data.missionId) : null;
  const checkpoint = mission?.checkpoints.find((c) => c.id === data.checkpointId);

  // Use store data or fallback to node data
  const checkpointData = checkpoint || {
    id: data.checkpointId || "unknown",
    title: data.label || "Unknown Checkpoint",
    estimatedMinutes: data.estimatedMinutes || 0,
    isComplete: data.isComplete || false,
  };

  const isComplete = checkpointData.isComplete;

  // Handle checkbox click
  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mission || !checkpoint) return;

    if (isComplete) {
      uncompleteCheckpoint(mission.id, checkpoint.id);
    } else {
      completeCheckpoint(mission.id, checkpoint.id);
    }
  };

  return (
    <>
      {/* Target Handle - Top */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-secondary hover:!border-accent transition-colors"
      />

      {/* Checkpoint Card */}
      <motion.div
        initial={false}
        animate={{
          scale: isComplete ? 0.98 : 1,
        }}
        className={cn(
          "w-[160px] rounded-md transition-all",
          isComplete && "opacity-70",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-void"
        )}
        style={{
          backgroundColor: "#1A1A1A",
        }}
      >
        <div className="p-3">
          {/* Checkbox + Title Row */}
          <div className="flex items-start gap-2.5">
            {/* Clickable Checkbox */}
            <button
              onClick={handleCheckboxClick}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5",
                isComplete
                  ? "bg-status-complete border-status-complete"
                  : "border-text-disabled hover:border-accent bg-transparent"
              )}
            >
              {isComplete && <Check className="w-3 h-3 text-void" />}
            </button>

            {/* Title */}
            <span
              className={cn(
                "text-sm leading-tight flex-1",
                isComplete
                  ? "text-text-disabled line-through"
                  : "text-text-primary"
              )}
            >
              {checkpointData.title}
            </span>
          </div>

          {/* Time Estimate */}
          <div className="flex items-center gap-1 mt-2 ml-7">
            <Clock className="w-3 h-3 text-text-disabled" />
            <span className="text-xs text-text-disabled">
              {checkpointData.estimatedMinutes} min
            </span>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export const CheckpointNode = memo(CheckpointNodeComponent);
