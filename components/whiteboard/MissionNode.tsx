"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface MissionNodeData extends Record<string, unknown> {
  label: string;
  status: "pending" | "in-progress" | "completed" | "bottleneck";
  tagColor?: string;
  timeEstimate?: number;
  timeActual?: number;
}

type MissionNodeType = Node<MissionNodeData, "mission">;

function MissionNodeComponent({ data, selected }: NodeProps<MissionNodeType>) {
  const nodeData = data;

  const statusColors = {
    pending: "border-text-disabled",
    "in-progress": "border-accent",
    completed: "border-status-complete",
    bottleneck: "border-status-bottleneck",
  };

  const statusBgColors = {
    pending: "bg-void",
    "in-progress": "bg-accent/10",
    completed: "bg-status-complete/10",
    bottleneck: "bg-status-bottleneck/10",
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-surface !border-2 !border-text-disabled"
      />
      <div
        className={cn(
          "min-w-[200px] rounded-xl border-2 transition-all",
          statusColors[nodeData.status],
          statusBgColors[nodeData.status],
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-void"
        )}
      >
        {/* Tag Color Bar */}
        {nodeData.tagColor && (
          <div
            className="h-1.5 rounded-t-lg"
            style={{ backgroundColor: nodeData.tagColor }}
          />
        )}

        {/* Content */}
        <div className="p-4">
          <p className="font-medium text-text-primary text-sm leading-tight">
            {nodeData.label}
          </p>

          {/* Time Info */}
          {(nodeData.timeEstimate || nodeData.timeActual) && (
            <div className="mt-2 flex items-center gap-2 text-xs text-text-secondary">
              {nodeData.timeEstimate && (
                <span>Est: {nodeData.timeEstimate}m</span>
              )}
              {nodeData.timeActual !== undefined && (
                <span>Actual: {nodeData.timeActual}m</span>
              )}
            </div>
          )}

          {/* Status Badge */}
          <div className="mt-3">
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded text-xs font-medium",
                nodeData.status === "pending" && "bg-text-disabled/20 text-text-disabled",
                nodeData.status === "in-progress" && "bg-accent/20 text-accent",
                nodeData.status === "completed" && "bg-status-complete/20 text-status-complete",
                nodeData.status === "bottleneck" && "bg-status-bottleneck/20 text-status-bottleneck"
              )}
            >
              {nodeData.status === "in-progress" ? "In Progress" :
               nodeData.status.charAt(0).toUpperCase() + nodeData.status.slice(1)}
            </span>
          </div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-surface !border-2 !border-text-disabled"
      />
    </>
  );
}

export const MissionNode = memo(MissionNodeComponent);
