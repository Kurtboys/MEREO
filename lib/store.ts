// ============================================
// MEREO - Zustand Store
// Skeleton for Chunk 1 - Will be expanded in Chunk 2
// ============================================

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Tag,
  Mission,
  DaySession,
  DailyWhiteboard,
  ExecutiveBrief,
  Position,
  StickyNote,
  LinkCard,
} from "./types";

export interface MereoStore {
  // Data
  tags: Tag[];
  missions: Mission[];
  currentSession: DaySession | null;
  whiteboards: Record<string, DailyWhiteboard>; // date -> whiteboard

  // Tag Actions (to be implemented in Chunk 2)
  addTag: (tag: Omit<Tag, "id" | "createdAt">) => void;
  updateTag: (id: string, updates: Partial<Tag>) => void;
  deleteTag: (id: string) => void;

  // Mission Actions (to be implemented in Chunk 2)
  addMission: (mission: Omit<Mission, "id" | "createdAt">) => void;
  updateMission: (id: string, updates: Partial<Mission>) => void;
  deleteMission: (id: string) => void;
  reorderMissions: (date: string, missionIds: string[]) => void;

  // Session Actions (to be implemented in Chunk 2)
  startDaySession: (endTime: Date) => void;
  endDaySession: () => ExecutiveBrief | null;

  // Execution Actions (to be implemented in Chunk 2)
  setMissionActive: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  bottleneckMission: (missionId: string, reason?: string) => void;
  completeCheckpoint: (missionId: string, checkpointId: string) => void;
  carryOverIncompleteMissions: () => void;

  // Whiteboard Actions (to be implemented in Chunk 2)
  initializeWhiteboard: (date: string, missions: Mission[]) => void;
  updateNodePosition: (
    date: string,
    nodeId: string,
    nodeType: "mission" | "checkpoint",
    position: Position
  ) => void;
  addStickyNote: (
    date: string,
    note: Omit<StickyNote, "id" | "createdAt">
  ) => void;
  updateStickyNote: (
    date: string,
    noteId: string,
    updates: Partial<StickyNote>
  ) => void;
  deleteStickyNote: (date: string, noteId: string) => void;
  addLinkCard: (date: string, link: Omit<LinkCard, "id" | "createdAt">) => void;
  deleteLinkCard: (date: string, linkId: string) => void;
  updateCanvasView: (date: string, zoom: number, pan: Position) => void;
}

// Placeholder store - actions to be implemented in Chunk 2
export const useMereoStore = create<MereoStore>()(
  persist(
    (set, get) => ({
      // Initial State
      tags: [],
      missions: [],
      currentSession: null,
      whiteboards: {},

      // Placeholder actions - will be implemented in Chunk 2
      addTag: () => {},
      updateTag: () => {},
      deleteTag: () => {},

      addMission: () => {},
      updateMission: () => {},
      deleteMission: () => {},
      reorderMissions: () => {},

      startDaySession: () => {},
      endDaySession: () => null,

      setMissionActive: () => {},
      completeMission: () => {},
      bottleneckMission: () => {},
      completeCheckpoint: () => {},
      carryOverIncompleteMissions: () => {},

      initializeWhiteboard: () => {},
      updateNodePosition: () => {},
      addStickyNote: () => {},
      updateStickyNote: () => {},
      deleteStickyNote: () => {},
      addLinkCard: () => {},
      deleteLinkCard: () => {},
      updateCanvasView: () => {},
    }),
    {
      name: "mereo-storage",
    }
  )
);
