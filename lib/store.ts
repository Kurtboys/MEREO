// ============================================
// MEREO - Zustand Store
// Complete implementation with all actions
// ============================================

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { useEffect, useState } from "react";
import type {
  Tag,
  Mission,
  Checkpoint,
  DaySession,
  DailyWhiteboard,
  ExecutiveBrief,
  Position,
  StickyNote,
  LinkCard,
  StickyNoteColor,
} from "./types";
import {
  generateId,
  getTodayDateString,
  getTomorrowDateString,
  getMinutesDifference,
  calculateTotalMinutes,
} from "./utils";
import { createSafeStorage } from "./safe-storage";

// ============================================
// Store Interface
// ============================================

export interface MereoStore {
  // Data
  tags: Tag[];
  missions: Mission[];
  currentSession: DaySession | null;
  whiteboards: Record<string, DailyWhiteboard>;

  // Computed helpers
  getMissionsByDate: (date: string) => Mission[];
  getMissionById: (id: string) => Mission | undefined;
  getTagById: (id: string) => Tag | undefined;
  getActiveMission: () => Mission | undefined;
  getNextScheduledMission: (date: string) => Mission | undefined;

  // Tag Actions
  addTag: (tag: Omit<Tag, "id" | "createdAt">) => Tag;
  updateTag: (id: string, updates: Partial<Omit<Tag, "id" | "createdAt">>) => void;
  deleteTag: (id: string) => void;

  // Mission Actions
  addMission: (mission: Omit<Mission, "id" | "createdAt">) => Mission;
  updateMission: (id: string, updates: Partial<Omit<Mission, "id" | "createdAt">>) => void;
  deleteMission: (id: string) => void;
  reorderMissions: (date: string, missionIds: string[]) => void;
  addCheckpoint: (missionId: string, checkpoint: Omit<Checkpoint, "id">) => void;
  updateCheckpoint: (missionId: string, checkpointId: string, updates: Partial<Checkpoint>) => void;
  deleteCheckpoint: (missionId: string, checkpointId: string) => void;

  // Session Actions
  startDaySession: (endTime: Date) => void;
  endDaySession: () => ExecutiveBrief | null;

  // Execution Actions
  setMissionActive: (missionId: string) => void;
  completeMission: (missionId: string) => void;
  bottleneckMission: (missionId: string, reason?: string) => void;
  completeCheckpoint: (missionId: string, checkpointId: string) => void;
  uncompleteCheckpoint: (missionId: string, checkpointId: string) => void;
  carryOverIncompleteMissions: () => void;

  // Whiteboard Actions
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
  updateLinkCard: (date: string, linkId: string, updates: Partial<LinkCard>) => void;
  deleteLinkCard: (date: string, linkId: string) => void;
  updateCanvasView: (date: string, zoom: number, pan: Position) => void;
  getWhiteboard: (date: string) => DailyWhiteboard | undefined;

  // Seed data
  loadSeedData: () => void;
  clearAllData: () => void;
}

// ============================================
// Store Implementation
// ============================================

export const useMereoStore = create<MereoStore>()(
  persist(
    (set, get) => ({
      // ========================================
      // Initial State
      // ========================================
      tags: [],
      missions: [],
      currentSession: null,
      whiteboards: {},

      // ========================================
      // Computed Helpers
      // ========================================
      getMissionsByDate: (date: string) => {
        return get()
          .missions.filter((m) => m.scheduledDate === date)
          .sort((a, b) => a.order - b.order);
      },

      getMissionById: (id: string) => {
        return get().missions.find((m) => m.id === id);
      },

      getTagById: (id: string) => {
        return get().tags.find((t) => t.id === id);
      },

      getActiveMission: () => {
        return get().missions.find((m) => m.status === "active");
      },

      getNextScheduledMission: (date: string) => {
        return get()
          .missions.filter((m) => m.scheduledDate === date && m.status === "scheduled")
          .sort((a, b) => a.order - b.order)[0];
      },

      // ========================================
      // Tag Actions
      // ========================================
      addTag: (tagData) => {
        const newTag: Tag = {
          ...tagData,
          id: generateId(),
          createdAt: new Date(),
        };
        set((state) => ({
          tags: [...state.tags, newTag],
        }));
        return newTag;
      },

      updateTag: (id, updates) => {
        set((state) => ({
          tags: state.tags.map((tag) =>
            tag.id === id ? { ...tag, ...updates } : tag
          ),
        }));
      },

      deleteTag: (id) => {
        set((state) => ({
          tags: state.tags.filter((tag) => tag.id !== id),
        }));
      },

      // ========================================
      // Mission Actions
      // ========================================
      addMission: (missionData) => {
        const totalMinutes = calculateTotalMinutes(missionData.checkpoints);
        const newMission: Mission = {
          ...missionData,
          id: generateId(),
          createdAt: new Date(),
          totalEstimatedMinutes: totalMinutes,
          checkpoints: missionData.checkpoints.map((cp, index) => ({
            ...cp,
            id: cp.id || generateId(),
            order: cp.order ?? index,
          })),
        };
        set((state) => ({
          missions: [...state.missions, newMission],
        }));
        return newMission;
      },

      updateMission: (id, updates) => {
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.id !== id) return mission;

            const updatedMission = { ...mission, ...updates };

            // Recalculate total if checkpoints changed
            if (updates.checkpoints) {
              updatedMission.totalEstimatedMinutes = calculateTotalMinutes(
                updates.checkpoints
              );
            }

            return updatedMission;
          }),
        }));
      },

      deleteMission: (id) => {
        set((state) => ({
          missions: state.missions.filter((m) => m.id !== id),
        }));
      },

      reorderMissions: (date, missionIds) => {
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.scheduledDate !== date) return mission;
            const newOrder = missionIds.indexOf(mission.id);
            return newOrder !== -1 ? { ...mission, order: newOrder } : mission;
          }),
        }));
      },

      addCheckpoint: (missionId, checkpointData) => {
        const newCheckpoint: Checkpoint = {
          ...checkpointData,
          id: generateId(),
        };
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.id !== missionId) return mission;
            const checkpoints = [...mission.checkpoints, newCheckpoint];
            return {
              ...mission,
              checkpoints,
              totalEstimatedMinutes: calculateTotalMinutes(checkpoints),
            };
          }),
        }));
      },

      updateCheckpoint: (missionId, checkpointId, updates) => {
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.id !== missionId) return mission;
            const checkpoints = mission.checkpoints.map((cp) =>
              cp.id === checkpointId ? { ...cp, ...updates } : cp
            );
            return {
              ...mission,
              checkpoints,
              totalEstimatedMinutes: calculateTotalMinutes(checkpoints),
            };
          }),
        }));
      },

      deleteCheckpoint: (missionId, checkpointId) => {
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.id !== missionId) return mission;
            const checkpoints = mission.checkpoints.filter(
              (cp) => cp.id !== checkpointId
            );
            return {
              ...mission,
              checkpoints,
              totalEstimatedMinutes: calculateTotalMinutes(checkpoints),
            };
          }),
        }));
      },

      // ========================================
      // Session Actions
      // ========================================
      startDaySession: (endTime) => {
        const today = getTodayDateString();
        const todayMissions = get().getMissionsByDate(today);

        const newSession: DaySession = {
          id: generateId(),
          date: today,
          startTime: new Date(),
          endTime,
          missionIds: todayMissions.map((m) => m.id),
          isActive: true,
        };

        set({ currentSession: newSession });

        // Initialize whiteboard for today if not exists
        if (!get().whiteboards[today]) {
          get().initializeWhiteboard(today, todayMissions);
        }

        // Activate first mission if exists
        if (todayMissions.length > 0 && todayMissions[0].status === "scheduled") {
          get().setMissionActive(todayMissions[0].id);
        }
      },

      endDaySession: () => {
        const { currentSession, missions, tags } = get();
        if (!currentSession) return null;

        const sessionMissions = missions.filter((m) =>
          currentSession.missionIds.includes(m.id)
        );

        const completedMissions = sessionMissions
          .filter((m) => m.status === "completed")
          .map((m) => ({
            missionId: m.id,
            estimatedMinutes: m.totalEstimatedMinutes,
            actualMinutes: m.actualMinutes || m.totalEstimatedMinutes,
          }));

        const bottleneckMissions = sessionMissions
          .filter((m) => m.status === "bottleneck")
          .map((m) => ({
            missionId: m.id,
            reason: m.bottleneckReason || "No reason provided",
          }));

        const incompleteMissions = sessionMissions
          .filter((m) => m.status === "scheduled" || m.status === "active")
          .map((m) => m.id);

        // Calculate time by tag
        const timeByTag: Record<string, number> = {};
        completedMissions.forEach((cm) => {
          const mission = missions.find((m) => m.id === cm.missionId);
          if (mission) {
            timeByTag[mission.tagId] =
              (timeByTag[mission.tagId] || 0) + cm.actualMinutes;
          }
        });

        const brief: ExecutiveBrief = {
          sessionId: currentSession.id,
          date: currentSession.date,
          completedMissions,
          bottleneckMissions,
          incompleteMissions,
          totalActiveMinutes: completedMissions.reduce(
            (sum, m) => sum + m.actualMinutes,
            0
          ),
          timeByTag,
        };

        // Mark incomplete missions and carry them over
        set((state) => ({
          currentSession: {
            ...currentSession,
            actualEndTime: new Date(),
            isActive: false,
          },
          missions: state.missions.map((m) => {
            if (incompleteMissions.includes(m.id)) {
              return { ...m, status: "incomplete" as const };
            }
            return m;
          }),
        }));

        // Carry over incomplete missions to tomorrow
        get().carryOverIncompleteMissions();

        return brief;
      },

      // ========================================
      // Execution Actions
      // ========================================
      setMissionActive: (missionId) => {
        set((state) => ({
          missions: state.missions.map((m) => {
            if (m.id === missionId) {
              return {
                ...m,
                status: "active" as const,
                startedAt: new Date(),
              };
            }
            // Deactivate any currently active mission
            if (m.status === "active") {
              return { ...m, status: "scheduled" as const };
            }
            return m;
          }),
        }));
      },

      completeMission: (missionId) => {
        const mission = get().getMissionById(missionId);
        if (!mission) return;

        const actualMinutes = mission.startedAt
          ? getMinutesDifference(mission.startedAt, new Date())
          : mission.totalEstimatedMinutes;

        set((state) => ({
          missions: state.missions.map((m) => {
            if (m.id === missionId) {
              return {
                ...m,
                status: "completed" as const,
                completedAt: new Date(),
                actualMinutes,
                checkpoints: m.checkpoints.map((cp) => ({
                  ...cp,
                  isComplete: true,
                  completedAt: cp.completedAt || new Date(),
                })),
              };
            }
            return m;
          }),
        }));

        // Auto-advance: Find next scheduled mission (not just next in index)
        const nextMission = get().getNextScheduledMission(mission.scheduledDate);
        if (nextMission) {
          get().setMissionActive(nextMission.id);
        }
      },

      bottleneckMission: (missionId, reason) => {
        const mission = get().getMissionById(missionId);
        if (!mission) return;

        // Get max order for today's missions to move bottlenecked mission to bottom
        const todayMissions = get().getMissionsByDate(mission.scheduledDate);
        const maxOrder = Math.max(...todayMissions.map((m) => m.order), 0);

        set((state) => ({
          missions: state.missions.map((m) => {
            if (m.id === missionId) {
              return {
                ...m,
                status: "bottleneck" as const,
                bottleneckReason: reason,
                order: maxOrder + 1, // Move to bottom
              };
            }
            return m;
          }),
        }));

        // Auto-advance: Find next scheduled mission
        const nextMission = get().getNextScheduledMission(mission.scheduledDate);
        if (nextMission) {
          get().setMissionActive(nextMission.id);
        }
      },

      completeCheckpoint: (missionId, checkpointId) => {
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.id !== missionId) return mission;
            return {
              ...mission,
              checkpoints: mission.checkpoints.map((cp) =>
                cp.id === checkpointId
                  ? { ...cp, isComplete: true, completedAt: new Date() }
                  : cp
              ),
            };
          }),
        }));
      },

      uncompleteCheckpoint: (missionId, checkpointId) => {
        set((state) => ({
          missions: state.missions.map((mission) => {
            if (mission.id !== missionId) return mission;
            return {
              ...mission,
              checkpoints: mission.checkpoints.map((cp) =>
                cp.id === checkpointId
                  ? { ...cp, isComplete: false, completedAt: undefined }
                  : cp
              ),
            };
          }),
        }));
      },

      carryOverIncompleteMissions: () => {
        const today = getTodayDateString();
        const tomorrow = getTomorrowDateString();

        const incompleteMissions = get().missions.filter(
          (m) =>
            m.scheduledDate === today &&
            (m.status === "incomplete" || m.status === "bottleneck")
        );

        if (incompleteMissions.length === 0) return;

        // Get existing tomorrow missions to determine order offset
        const tomorrowMissions = get().getMissionsByDate(tomorrow);
        const orderOffset = tomorrowMissions.length;

        set((state) => ({
          missions: state.missions.map((m) => {
            if (!incompleteMissions.find((im) => im.id === m.id)) return m;

            return {
              ...m,
              scheduledDate: tomorrow,
              status: "scheduled" as const,
              order: orderOffset + incompleteMissions.findIndex((im) => im.id === m.id),
              startedAt: undefined,
              completedAt: undefined,
              actualMinutes: undefined,
              // Reset checkpoints for incomplete missions (keep state for bottleneck)
              checkpoints:
                m.status === "incomplete"
                  ? m.checkpoints.map((cp) => ({
                      ...cp,
                      isComplete: false,
                      completedAt: undefined,
                    }))
                  : m.checkpoints,
            };
          }),
        }));
      },

      // ========================================
      // Whiteboard Actions
      // ========================================
      initializeWhiteboard: (date, missions) => {
        const missionPositions: Record<string, Position> = {};
        const checkpointPositions: Record<string, Position> = {};

        // Auto-layout: missions stacked vertically, checkpoints horizontal
        missions.forEach((mission, missionIndex) => {
          const missionY = 100 + missionIndex * 300;
          missionPositions[mission.id] = { x: 400, y: missionY };

          mission.checkpoints.forEach((checkpoint, cpIndex) => {
            checkpointPositions[checkpoint.id] = {
              x: 150 + cpIndex * 180,
              y: missionY + 120,
            };
          });
        });

        const whiteboard: DailyWhiteboard = {
          id: generateId(),
          date,
          layout: { missionPositions, checkpointPositions },
          stickyNotes: [],
          linkCards: [],
          canvasZoom: 1,
          canvasPan: { x: 0, y: 0 },
        };

        set((state) => ({
          whiteboards: { ...state.whiteboards, [date]: whiteboard },
        }));
      },

      updateNodePosition: (date, nodeId, nodeType, position) => {
        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          const layoutKey =
            nodeType === "mission" ? "missionPositions" : "checkpointPositions";

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                layout: {
                  ...whiteboard.layout,
                  [layoutKey]: {
                    ...whiteboard.layout[layoutKey],
                    [nodeId]: position,
                  },
                },
              },
            },
          };
        });
      },

      addStickyNote: (date, noteData) => {
        const newNote: StickyNote = {
          ...noteData,
          id: generateId(),
          createdAt: new Date(),
        };

        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                stickyNotes: [...whiteboard.stickyNotes, newNote],
              },
            },
          };
        });
      },

      updateStickyNote: (date, noteId, updates) => {
        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                stickyNotes: whiteboard.stickyNotes.map((note) =>
                  note.id === noteId ? { ...note, ...updates } : note
                ),
              },
            },
          };
        });
      },

      deleteStickyNote: (date, noteId) => {
        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                stickyNotes: whiteboard.stickyNotes.filter(
                  (note) => note.id !== noteId
                ),
              },
            },
          };
        });
      },

      addLinkCard: (date, linkData) => {
        const newLink: LinkCard = {
          ...linkData,
          id: generateId(),
          createdAt: new Date(),
        };

        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                linkCards: [...whiteboard.linkCards, newLink],
              },
            },
          };
        });
      },

      updateLinkCard: (date, linkId, updates) => {
        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                linkCards: whiteboard.linkCards.map((link) =>
                  link.id === linkId ? { ...link, ...updates } : link
                ),
              },
            },
          };
        });
      },

      deleteLinkCard: (date, linkId) => {
        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                linkCards: whiteboard.linkCards.filter(
                  (link) => link.id !== linkId
                ),
              },
            },
          };
        });
      },

      updateCanvasView: (date, zoom, pan) => {
        set((state) => {
          const whiteboard = state.whiteboards[date];
          if (!whiteboard) return state;

          return {
            whiteboards: {
              ...state.whiteboards,
              [date]: {
                ...whiteboard,
                canvasZoom: zoom,
                canvasPan: pan,
              },
            },
          };
        });
      },

      getWhiteboard: (date) => {
        return get().whiteboards[date];
      },

      // ========================================
      // Seed & Reset
      // ========================================
      loadSeedData: () => {
        const today = getTodayDateString();

        // Create tags
        const tags: Tag[] = [
          {
            id: "tag-jargon",
            name: "Jargon Junkie",
            color: "#3B82F6",
            createdAt: new Date(),
          },
          {
            id: "tag-craftworks",
            name: "12:53 Craftworks",
            color: "#F59E0B",
            createdAt: new Date(),
          },
          {
            id: "tag-lead",
            name: "Lead Resurgence",
            color: "#10B981",
            createdAt: new Date(),
          },
          {
            id: "tag-sundowner",
            name: "For The Sundowner",
            color: "#8B5CF6",
            createdAt: new Date(),
          },
        ];

        // Create missions with checkpoints
        const missions: Mission[] = [
          {
            id: "mission-1",
            title: "Client Proposal Draft",
            tagId: "tag-jargon",
            checkpoints: [
              {
                id: "cp-1-1",
                title: "Review client requirements doc",
                estimatedMinutes: 15,
                isComplete: false,
                order: 0,
              },
              {
                id: "cp-1-2",
                title: "Outline proposal structure",
                estimatedMinutes: 20,
                isComplete: false,
                order: 1,
              },
              {
                id: "cp-1-3",
                title: "Write executive summary",
                estimatedMinutes: 30,
                isComplete: false,
                order: 2,
              },
              {
                id: "cp-1-4",
                title: "Add pricing breakdown",
                estimatedMinutes: 25,
                isComplete: false,
                order: 3,
              },
            ],
            totalEstimatedMinutes: 90,
            status: "scheduled",
            scheduledDate: today,
            order: 0,
            createdAt: new Date(),
            createdBy: "manual",
          },
          {
            id: "mission-2",
            title: "Website Redesign Mockups",
            tagId: "tag-craftworks",
            checkpoints: [
              {
                id: "cp-2-1",
                title: "Sketch wireframe layouts",
                estimatedMinutes: 25,
                isComplete: false,
                order: 0,
              },
              {
                id: "cp-2-2",
                title: "Design hero section",
                estimatedMinutes: 30,
                isComplete: false,
                order: 1,
              },
              {
                id: "cp-2-3",
                title: "Create navigation components",
                estimatedMinutes: 20,
                isComplete: false,
                order: 2,
              },
              {
                id: "cp-2-4",
                title: "Design footer and CTA",
                estimatedMinutes: 15,
                isComplete: false,
                order: 3,
              },
              {
                id: "cp-2-5",
                title: "Export assets for dev handoff",
                estimatedMinutes: 10,
                isComplete: false,
                order: 4,
              },
            ],
            totalEstimatedMinutes: 100,
            status: "scheduled",
            scheduledDate: today,
            order: 1,
            createdAt: new Date(),
            createdBy: "manual",
          },
          {
            id: "mission-3",
            title: "Lead Follow-up Emails",
            tagId: "tag-lead",
            checkpoints: [
              {
                id: "cp-3-1",
                title: "Review CRM for warm leads",
                estimatedMinutes: 10,
                isComplete: false,
                order: 0,
              },
              {
                id: "cp-3-2",
                title: "Draft personalized emails",
                estimatedMinutes: 30,
                isComplete: false,
                order: 1,
              },
              {
                id: "cp-3-3",
                title: "Schedule follow-up sequences",
                estimatedMinutes: 15,
                isComplete: false,
                order: 2,
              },
            ],
            totalEstimatedMinutes: 55,
            status: "scheduled",
            scheduledDate: today,
            order: 2,
            createdAt: new Date(),
            createdBy: "manual",
          },
        ];

        set({ tags, missions, currentSession: null, whiteboards: {} });
      },

      clearAllData: () => {
        set({
          tags: [],
          missions: [],
          currentSession: null,
          whiteboards: {},
        });
      },
    }),
    {
      name: "mereo-storage",
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({
        tags: state.tags,
        missions: state.missions,
        currentSession: state.currentSession,
        whiteboards: state.whiteboards,
      }),
    }
  )
);

// ============================================
// Hydration Hook for SSR
// ============================================

export function useStoreHydration() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // On client mount, check if already hydrated or wait for it
    const checkHydration = () => {
      if (useMereoStore.persist.hasHydrated()) {
        setHydrated(true);
        return true;
      }
      return false;
    };

    // Check immediately
    if (checkHydration()) return;

    // If not hydrated yet, subscribe to hydration complete
    const unsubFinishHydration = useMereoStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    return () => {
      unsubFinishHydration();
    };
  }, []);

  return hydrated;
}

// ============================================
// Selector Hooks for Performance
// ============================================

export const useTagById = (id: string) =>
  useMereoStore((state) => state.tags.find((t) => t.id === id));

export const useMissionsByDate = (date: string) =>
  useMereoStore((state) =>
    state.missions
      .filter((m) => m.scheduledDate === date)
      .sort((a, b) => a.order - b.order)
  );

export const useActiveMission = () =>
  useMereoStore((state) => state.missions.find((m) => m.status === "active"));

export const useTags = () => useMereoStore((state) => state.tags);

export const useCurrentSession = () =>
  useMereoStore((state) => state.currentSession);
