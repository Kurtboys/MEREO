"use client";

import { memo, useEffect, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import type { MissionStatus } from "@/lib/types";

export interface MissionEdgeData extends Record<string, unknown> {
  sourceStatus?: MissionStatus;
  targetStatus?: MissionStatus;
  animated?: boolean;
  onAnimationComplete?: () => void;
}

function MissionEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps) {
  const edgeData = (data || {}) as MissionEdgeData;
  const sourceStatus = edgeData.sourceStatus || "scheduled";
  const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
  const [prevStatus, setPrevStatus] = useState(sourceStatus);

  // Detect status change to completed
  useEffect(() => {
    if (prevStatus !== "completed" && sourceStatus === "completed") {
      setShowCompletionAnimation(true);
    }
    setPrevStatus(sourceStatus);
  }, [sourceStatus, prevStatus]);

  // Get edge path
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 16,
  });

  // Determine edge styling based on source status
  const getEdgeStyle = () => {
    switch (sourceStatus) {
      case "completed":
        return {
          stroke: "#10B981",
          strokeWidth: 2,
          strokeDasharray: "none",
          filter: "none",
        };
      case "active":
        return {
          stroke: "#3B82F6",
          strokeWidth: 2,
          strokeDasharray: "none",
          filter: "drop-shadow(0 0 4px #3B82F680)",
        };
      case "bottleneck":
        return {
          stroke: "#EF4444",
          strokeWidth: 2,
          strokeDasharray: "8,4",
          filter: "none",
        };
      default:
        return {
          stroke: "#3A3A3A",
          strokeWidth: 2,
          strokeDasharray: "8,4",
          filter: "none",
        };
    }
  };

  const style = getEdgeStyle();

  // Handle animation complete
  const handleAnimationComplete = () => {
    setShowCompletionAnimation(false);
    edgeData.onAnimationComplete?.();
  };

  return (
    <>
      {/* Main Edge */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: style.strokeDasharray,
          filter: style.filter,
          transition: "stroke 0.3s ease, stroke-dasharray 0.3s ease",
        }}
        markerEnd={markerEnd}
      />

      {/* Active edge glow overlay */}
      {sourceStatus === "active" && (
        <path
          d={edgePath}
          fill="none"
          stroke="#3B82F6"
          strokeWidth={6}
          strokeOpacity={0.2}
          style={{ pointerEvents: "none" }}
        />
      )}

      {/* Completion Animation - Traveling Dot */}
      <AnimatePresence>
        {showCompletionAnimation && (
          <EdgeLabelRenderer>
            <motion.div
              initial={{ offsetDistance: "0%" }}
              animate={{ offsetDistance: "100%" }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              onAnimationComplete={handleAnimationComplete}
              style={{
                position: "absolute",
                offsetPath: `path("${edgePath}")`,
                offsetRotate: "0deg",
                pointerEvents: "none",
              }}
            >
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.5, 1] }}
                transition={{
                  duration: 0.8,
                  ease: "easeOut",
                }}
                className="w-4 h-4 rounded-full bg-status-complete"
                style={{
                  boxShadow: "0 0 12px #10B981, 0 0 24px #10B98180",
                }}
              />
            </motion.div>
          </EdgeLabelRenderer>
        )}
      </AnimatePresence>

      {/* Arrow marker at end for active/complete edges */}
      {(sourceStatus === "active" || sourceStatus === "completed") && (
        <defs>
          <marker
            id={`arrow-${id}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path
              d="M 0 0 L 10 5 L 0 10 z"
              fill={sourceStatus === "completed" ? "#10B981" : "#3B82F6"}
            />
          </marker>
        </defs>
      )}
    </>
  );
}

export const MissionEdge = memo(MissionEdgeComponent);
