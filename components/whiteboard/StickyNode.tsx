"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/lib/utils";

export interface StickyNodeData extends Record<string, unknown> {
  content: string;
  color: "yellow" | "blue" | "green" | "pink" | "purple";
}

type StickyNodeType = Node<StickyNodeData, "sticky">;

const colorClasses = {
  yellow: "bg-amber-400/90 text-amber-950",
  blue: "bg-blue-400/90 text-blue-950",
  green: "bg-emerald-400/90 text-emerald-950",
  pink: "bg-pink-400/90 text-pink-950",
  purple: "bg-purple-400/90 text-purple-950",
};

function StickyNodeComponent({ data, selected }: NodeProps<StickyNodeType>) {
  const nodeData = data;

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-transparent !border-0"
      />
      <div
        className={cn(
          "w-[180px] min-h-[120px] rounded-sm shadow-lg p-4 transition-all",
          colorClasses[nodeData.color || "yellow"],
          selected && "ring-2 ring-white ring-offset-2 ring-offset-void"
        )}
        style={{
          transform: "rotate(-1deg)",
        }}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {nodeData.content}
        </p>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-transparent !border-0"
      />
    </>
  );
}

export const StickyNode = memo(StickyNodeComponent);
