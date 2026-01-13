"use client";

import { memo } from "react";
import {
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
} from "@xyflow/react";

export interface CheckpointEdgeData extends Record<string, unknown> {
  isComplete?: boolean;
  parentMissionActive?: boolean;
}

function CheckpointEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) {
  const edgeData = (data || {}) as CheckpointEdgeData;
  const isComplete = edgeData.isComplete || false;
  const parentMissionActive = edgeData.parentMissionActive || false;

  // Get edge path
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  // Determine styling
  const getEdgeStyle = () => {
    if (isComplete) {
      return {
        stroke: "#10B981",
        strokeWidth: 1.5,
        strokeOpacity: 0.6,
      };
    }
    if (parentMissionActive) {
      return {
        stroke: "#6B7280",
        strokeWidth: 1.5,
        strokeOpacity: 0.8,
      };
    }
    return {
      stroke: "#3A3A3A",
      strokeWidth: 1,
      strokeOpacity: 0.5,
    };
  };

  const style = getEdgeStyle();

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke: style.stroke,
        strokeWidth: style.strokeWidth,
        strokeOpacity: style.strokeOpacity,
        transition: "stroke 0.3s ease, stroke-opacity 0.3s ease",
      }}
    />
  );
}

export const CheckpointEdge = memo(CheckpointEdgeComponent);
