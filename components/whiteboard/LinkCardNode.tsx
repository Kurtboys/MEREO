"use client";

import { memo, useState, useCallback } from "react";
import {
  Handle,
  Position,
  type NodeProps,
  type Node,
  useReactFlow,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LinkCardNodeData extends Record<string, unknown> {
  title: string;
  url: string;
  favicon?: string;
  onDelete?: (nodeId: string) => void;
}

type LinkCardNodeType = Node<LinkCardNodeData, "linkCard">;

function LinkCardNodeComponent({ id, data, selected }: NodeProps<LinkCardNodeType>) {
  const { deleteElements } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Extract domain from URL
  const getDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  // Open URL in new tab
  const handleClick = useCallback(() => {
    if (!showDeleteConfirm) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  }, [data.url, showDeleteConfirm]);

  // Delete node
  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      deleteElements({ nodes: [{ id }] });
      data.onDelete?.(id);
    },
    [id, deleteElements, data]
  );

  // Show delete confirmation
  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  // Cancel delete
  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  }, []);

  return (
    <>
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-disabled"
      />

      {/* Link Card */}
      <div
        className={cn(
          "w-[180px] h-[80px] rounded-md cursor-pointer transition-all relative overflow-hidden",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-void"
        )}
        style={{
          backgroundColor: "#1A1A1A",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          if (!showDeleteConfirm) setShowDeleteConfirm(false);
        }}
        onClick={handleClick}
      >
        {/* Content */}
        <div className="p-3 h-full flex flex-col">
          {/* Header row */}
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              {/* Favicon or Link icon */}
              <div className="w-5 h-5 rounded bg-void flex items-center justify-center flex-shrink-0">
                {data.favicon ? (
                  <img src={data.favicon} alt="" className="w-4 h-4" />
                ) : (
                  <Link2 className="w-3 h-3 text-text-secondary" />
                )}
              </div>
              {/* External link indicator */}
              <ExternalLink className="w-3 h-3 text-text-disabled" />
            </div>

            {/* Delete button - visible on hover */}
            <AnimatePresence>
              {isHovered && !showDeleteConfirm && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={handleDeleteClick}
                  className="p-1 rounded hover:bg-red-500/20 transition-colors"
                  title="Delete link"
                >
                  <X className="w-3 h-3 text-text-disabled hover:text-status-bottleneck" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Title */}
          <p className="text-sm font-medium text-text-primary truncate leading-tight">
            {data.title || getDomain(data.url)}
          </p>

          {/* URL */}
          <p className="text-xs text-text-disabled truncate mt-auto">
            {getDomain(data.url)}
          </p>
        </div>

        {/* Hover overlay */}
        <AnimatePresence>
          {isHovered && !showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-accent/5 pointer-events-none"
            />
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-void/95 flex flex-col items-center justify-center gap-2 z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-xs text-text-primary">Delete link?</p>
              <div className="flex gap-2">
                <button
                  onClick={handleCancelDelete}
                  className="px-2 py-1 text-xs bg-surface-hover text-text-secondary rounded hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-2 py-1 text-xs bg-status-bottleneck/20 text-status-bottleneck rounded hover:bg-status-bottleneck/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-surface !border-2 !border-text-disabled"
      />
    </>
  );
}

export const LinkCardNode = memo(LinkCardNodeComponent);
