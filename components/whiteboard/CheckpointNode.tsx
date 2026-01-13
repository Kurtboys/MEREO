"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CheckpointNodeData extends Record<string, unknown> {
  label: string;
  isComplete: boolean;
}

type CheckpointNodeType = Node<CheckpointNodeData, "checkpoint">;

function CheckpointNodeComponent({ data, selected }: NodeProps<CheckpointNodeType>) {
  const nodeData = data;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-disabled"
      />
      <div
        className={cn(
          "min-w-[150px] rounded-lg border-2 bg-void p-3 transition-all",
          nodeData.isComplete
            ? "border-status-complete"
            : "border-status-warning",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-void"
        )}
      >
        <div className="flex items-center gap-2">
          <Flag
            className={cn(
              "w-4 h-4",
              nodeData.isComplete
                ? "text-status-complete"
                : "text-status-warning"
            )}
          />
          <span className="text-sm font-medium text-text-primary">
            {nodeData.label}
          </span>
        </div>
        {nodeData.isComplete && (
          <div className="mt-1 text-xs text-status-complete">
            Checkpoint reached
          </div>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-disabled"
      />
    </>
  );
}

export const CheckpointNode = memo(CheckpointNodeComponent);
