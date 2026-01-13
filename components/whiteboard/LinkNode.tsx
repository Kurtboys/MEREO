"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { ExternalLink, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LinkNodeData extends Record<string, unknown> {
  title: string;
  url: string;
  favicon?: string;
}

type LinkNodeType = Node<LinkNodeData, "link">;

function LinkNodeComponent({ data, selected }: NodeProps<LinkNodeType>) {
  const nodeData = data;

  // Extract domain from URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  return (
    <>
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-disabled"
      />
      <div
        className={cn(
          "min-w-[200px] max-w-[280px] rounded-lg border border-border-subtle bg-surface p-3 transition-all",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-void"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Favicon or Link Icon */}
          <div className="w-8 h-8 rounded bg-void flex items-center justify-center flex-shrink-0">
            {nodeData.favicon ? (
              <img
                src={nodeData.favicon}
                alt=""
                className="w-5 h-5"
              />
            ) : (
              <Link2 className="w-4 h-4 text-text-secondary" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {nodeData.title}
            </p>
            <p className="text-xs text-text-disabled truncate mt-0.5">
              {getDomain(nodeData.url)}
            </p>
          </div>

          {/* External Link Icon */}
          <ExternalLink className="w-4 h-4 text-text-disabled flex-shrink-0" />
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-disabled"
      />
    </>
  );
}

export const LinkNode = memo(LinkNodeComponent);
