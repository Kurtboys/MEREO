// ============================================
// MEREO - Whiteboard Layout Generator
// Converts mission data to React Flow nodes and edges
// ============================================

import type { Node, Edge } from "@xyflow/react";
import type { Mission, Tag, DailyWhiteboard, StickyNote, LinkCard, Position } from "./types";

// Layout configuration
const LAYOUT_CONFIG = {
  startX: 400,
  startY: 100,
  missionSpacingY: 400,
  checkpointOffsetY: 220,
  checkpointSpacingX: 180,
  stickyNoteOffsetX: 300,
  linkCardOffsetX: 300,
};

// Generate positions for missions and checkpoints
export function generateLayoutPositions(
  missions: Mission[]
): {
  missionPositions: Record<string, Position>;
  checkpointPositions: Record<string, Position>;
} {
  const missionPositions: Record<string, Position> = {};
  const checkpointPositions: Record<string, Position> = {};

  missions.forEach((mission, missionIndex) => {
    const missionY = LAYOUT_CONFIG.startY + missionIndex * LAYOUT_CONFIG.missionSpacingY;
    missionPositions[mission.id] = { x: LAYOUT_CONFIG.startX, y: missionY };

    // Center checkpoints horizontally below mission
    const checkpointCount = mission.checkpoints.length;
    if (checkpointCount > 0) {
      const totalWidth = (checkpointCount - 1) * LAYOUT_CONFIG.checkpointSpacingX;
      const startX = LAYOUT_CONFIG.startX - totalWidth / 2;

      mission.checkpoints.forEach((checkpoint, cpIndex) => {
        checkpointPositions[checkpoint.id] = {
          x: startX + cpIndex * LAYOUT_CONFIG.checkpointSpacingX,
          y: missionY + LAYOUT_CONFIG.checkpointOffsetY,
        };
      });
    }
  });

  return { missionPositions, checkpointPositions };
}

// Convert stored whiteboard data + missions to React Flow nodes
export function generateNodes(
  missions: Mission[],
  tags: Tag[],
  whiteboard: DailyWhiteboard | null
): Node[] {
  const nodes: Node[] = [];
  const { missionPositions, checkpointPositions } = whiteboard?.layout ||
    generateLayoutPositions(missions);

  // Helper to get tag by ID
  const getTag = (tagId: string) => tags.find((t) => t.id === tagId);

  // Add mission nodes
  missions.forEach((mission) => {
    const tag = getTag(mission.tagId);
    const position = missionPositions[mission.id] || { x: 400, y: 100 };
    const completedCheckpoints = mission.checkpoints.filter((c) => c.isComplete).length;

    nodes.push({
      id: `mission-${mission.id}`,
      type: "mission",
      position,
      data: {
        missionId: mission.id,
        label: mission.title,
        status: mission.status,
        tagColor: tag?.color || "#3B82F6",
        tagName: tag?.name || "Untagged",
        totalMinutes: mission.totalEstimatedMinutes,
        checkpointCount: mission.checkpoints.length,
        completedCheckpoints,
      },
    });

    // Add checkpoint nodes for this mission
    mission.checkpoints.forEach((checkpoint) => {
      const cpPosition = checkpointPositions[checkpoint.id] || {
        x: position.x,
        y: position.y + 200,
      };

      nodes.push({
        id: `checkpoint-${checkpoint.id}`,
        type: "checkpoint",
        position: cpPosition,
        data: {
          missionId: mission.id,
          checkpointId: checkpoint.id,
          label: checkpoint.title,
          estimatedMinutes: checkpoint.estimatedMinutes,
          isComplete: checkpoint.isComplete,
        },
      });
    });
  });

  // Add sticky notes
  if (whiteboard?.stickyNotes) {
    whiteboard.stickyNotes.forEach((note) => {
      nodes.push({
        id: `sticky-${note.id}`,
        type: "stickyNote",
        position: note.position,
        data: {
          content: note.content,
          color: note.color,
        },
        style: { width: note.size.width, height: note.size.height },
      });
    });
  }

  // Add link cards
  if (whiteboard?.linkCards) {
    whiteboard.linkCards.forEach((link) => {
      nodes.push({
        id: `link-${link.id}`,
        type: "linkCard",
        position: link.position,
        data: {
          url: link.url,
          title: link.title || "",
        },
      });
    });
  }

  return nodes;
}

// Generate edges between missions and checkpoints
export function generateEdges(missions: Mission[], tags: Tag[]): Edge[] {
  const edges: Edge[] = [];
  const getTag = (tagId: string) => tags.find((t) => t.id === tagId);

  missions.forEach((mission, missionIndex) => {
    const tag = getTag(mission.tagId);
    const tagColor = tag?.color || "#3B82F6";

    // Edge from previous mission to this mission (if not first)
    if (missionIndex > 0) {
      const prevMission = missions[missionIndex - 1];
      edges.push({
        id: `edge-mission-${prevMission.id}-to-${mission.id}`,
        source: `mission-${prevMission.id}`,
        sourceHandle: "mission-out",
        target: `mission-${mission.id}`,
        type: "mission",
        data: {
          sourceStatus: prevMission.status,
          targetStatus: mission.status,
        },
      });
    }

    // Edges from mission to checkpoints
    mission.checkpoints.forEach((checkpoint, cpIndex) => {
      // Determine which handle to use based on checkpoint position
      const handleId = cpIndex === 0
        ? "checkpoint-out-left"
        : cpIndex === mission.checkpoints.length - 1
        ? "checkpoint-out-right"
        : "mission-out";

      edges.push({
        id: `edge-${mission.id}-to-${checkpoint.id}`,
        source: `mission-${mission.id}`,
        sourceHandle: mission.checkpoints.length > 1
          ? (cpIndex < mission.checkpoints.length / 2 ? "checkpoint-out-left" : "checkpoint-out-right")
          : "mission-out",
        target: `checkpoint-${checkpoint.id}`,
        type: "checkpoint",
        data: {
          isComplete: checkpoint.isComplete,
          parentMissionActive: mission.status === "active",
        },
      });
    });
  });

  return edges;
}

// Full layout generator - combines nodes and edges
export function generateWhiteboardLayout(
  missions: Mission[],
  tags: Tag[],
  whiteboard: DailyWhiteboard | null
): { nodes: Node[]; edges: Edge[] } {
  const nodes = generateNodes(missions, tags, whiteboard);
  const edges = generateEdges(missions, tags);
  return { nodes, edges };
}

// Parse node ID to get type and actual ID
export function parseNodeId(nodeId: string): { type: string; id: string } | null {
  const parts = nodeId.split("-");
  if (parts.length < 2) return null;
  const type = parts[0];
  const id = parts.slice(1).join("-");
  return { type, id };
}
