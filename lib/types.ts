// ============================================
// MEREO - Core Type Definitions
// ============================================

// === CORE TYPES ===

export interface Tag {
  id: string;
  name: string;
  color: string; // hex color
  createdAt: Date;
}

export interface Checkpoint {
  id: string;
  title: string;
  estimatedMinutes: number;
  isComplete: boolean;
  completedAt?: Date;
  order: number;
}

export type MissionStatus =
  | "scheduled"
  | "active"
  | "completed"
  | "bottleneck"
  | "incomplete";

export interface Mission {
  id: string;
  title: string;
  tagId: string;
  checkpoints: Checkpoint[];
  totalEstimatedMinutes: number;
  actualMinutes?: number;
  status: MissionStatus;
  bottleneckReason?: string;
  scheduledDate: string; // YYYY-MM-DD
  order: number; // order within the day
  createdAt: Date;
  startedAt?: Date; // when mission became active
  completedAt?: Date;
  createdBy: "manual" | "ai";
}

export interface DaySession {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: Date; // actual login time
  endTime: Date; // user-set end time
  actualEndTime?: Date; // when they actually logged out
  missionIds: string[]; // mission IDs in order
  isActive: boolean;
}

export interface ExecutiveBrief {
  sessionId: string;
  date: string;
  completedMissions: {
    missionId: string;
    estimatedMinutes: number;
    actualMinutes: number;
  }[];
  bottleneckMissions: {
    missionId: string;
    reason: string;
  }[];
  incompleteMissions: string[]; // mission IDs
  totalActiveMinutes: number;
  timeByTag: Record<string, number>; // tagId -> minutes
}

// === WHITEBOARD TYPES ===

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export type StickyNoteColor = "yellow" | "pink" | "blue" | "green" | "purple";

export interface StickyNote {
  id: string;
  content: string;
  position: Position;
  size: Size;
  color: StickyNoteColor;
  createdAt: Date;
}

export interface LinkCard {
  id: string;
  url: string;
  title?: string;
  position: Position;
  createdAt: Date;
}

export interface WhiteboardLayout {
  missionPositions: Record<string, Position>; // missionId -> position
  checkpointPositions: Record<string, Position>; // checkpointId -> position
}

export interface DailyWhiteboard {
  id: string;
  date: string; // YYYY-MM-DD
  layout: WhiteboardLayout;
  stickyNotes: StickyNote[];
  linkCards: LinkCard[];
  canvasZoom: number;
  canvasPan: Position;
}
