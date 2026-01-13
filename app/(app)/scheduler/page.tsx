"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronDown,
  Plus,
  Filter,
} from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { formatDateKey, cn } from "@/lib/utils";
import { MiniCalendar } from "@/components/MiniCalendar";
import { MissionCard } from "@/components/MissionCard";

export default function SchedulerPage() {
  const [isClient, setIsClient] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [draggedMissionId, setDraggedMissionId] = useState<string | null>(null);
  const [dragOverMissionId, setDragOverMissionId] = useState<string | null>(null);

  const { tags, missions, loadSeedData, reorderMissions } = useMereoStore();

  // Only render on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-tag-dropdown]")) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Get dates with missions for calendar dots
  const datesWithMissions = useMemo(() => {
    const dates = new Set<string>();
    missions.forEach((m) => dates.add(m.scheduledDate));
    return Array.from(dates);
  }, [missions]);

  // Get missions for selected date (optionally filtered by tag)
  const selectedDateKey = formatDateKey(selectedDate);

  const filteredMissions = useMemo(() => {
    return missions
      .filter((m) => m.scheduledDate === selectedDateKey)
      .filter((m) => (selectedTagId ? m.tagId === selectedTagId : true))
      .sort((a, b) => a.order - b.order);
  }, [missions, selectedDateKey, selectedTagId]);

  // Get selected tag
  const selectedTag = selectedTagId
    ? tags.find((t) => t.id === selectedTagId)
    : null;

  // ============================================
  // Drag and Drop Handlers
  // ============================================
  const handleDragStart = useCallback((missionId: string) => {
    setDraggedMissionId(missionId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, missionId: string) => {
    e.preventDefault();
    if (draggedMissionId && missionId !== draggedMissionId) {
      setDragOverMissionId(missionId);
    }
  }, [draggedMissionId]);

  const handleDragEnd = useCallback(() => {
    if (draggedMissionId && dragOverMissionId) {
      // Get current order
      const currentMissions = missions
        .filter((m) => m.scheduledDate === selectedDateKey)
        .sort((a, b) => a.order - b.order);

      const draggedIndex = currentMissions.findIndex((m) => m.id === draggedMissionId);
      const targetIndex = currentMissions.findIndex((m) => m.id === dragOverMissionId);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        // Create new order
        const newOrder = [...currentMissions];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, removed);

        // Update store
        reorderMissions(selectedDateKey, newOrder.map((m) => m.id));
      }
    }

    setDraggedMissionId(null);
    setDragOverMissionId(null);
  }, [draggedMissionId, dragOverMissionId, missions, selectedDateKey, reorderMissions]);

  // Loading state
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left Panel */}
      <div className="w-[320px] border-r border-border-subtle p-6 flex flex-col bg-surface">
        {/* Header */}
        <h2 className="text-xl font-bold mb-6">Scheduler</h2>

        {/* Mini Calendar */}
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
          datesWithMissions={datesWithMissions}
          className="mb-6"
        />

        {/* Divider */}
        <div className="border-t border-border-subtle my-4" />

        {/* Tag Filter Dropdown */}
        <div className="relative" data-tag-dropdown>
          <label className="text-xs text-text-disabled uppercase tracking-wide mb-2 block">
            Filter by Tag
          </label>
          <button
            onClick={() => setShowTagDropdown(!showTagDropdown)}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-colors",
              showTagDropdown
                ? "border-accent bg-surface-hover"
                : "border-border-subtle hover:border-text-disabled bg-void"
            )}
          >
            <div className="flex items-center gap-2">
              {selectedTag ? (
                <>
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedTag.color }}
                  />
                  <span className="text-text-primary">{selectedTag.name}</span>
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4 text-text-secondary" />
                  <span className="text-text-secondary">All Tags</span>
                </>
              )}
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-text-secondary transition-transform",
                showTagDropdown && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showTagDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-subtle rounded-lg shadow-lg z-10 overflow-hidden"
              >
                {/* All Tags option */}
                <button
                  onClick={() => {
                    setSelectedTagId(null);
                    setShowTagDropdown(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-4 py-3 text-left transition-colors",
                    selectedTagId === null
                      ? "bg-accent/10 text-accent"
                      : "hover:bg-surface-hover text-text-primary"
                  )}
                >
                  <Filter className="w-4 h-4" />
                  <span>All Tags</span>
                </button>

                {/* Tag options */}
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => {
                      setSelectedTagId(tag.id);
                      setShowTagDropdown(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-3 text-left transition-colors",
                      selectedTagId === tag.id
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-surface-hover text-text-primary"
                    )}
                  >
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    <span>{tag.name}</span>
                  </button>
                ))}

                {tags.length === 0 && (
                  <div className="px-4 py-3 text-text-disabled text-sm">
                    No tags created yet
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags Overview at bottom */}
        <div className="mt-auto pt-6">
          <p className="text-xs text-text-disabled uppercase tracking-wide mb-3">
            Your Tags
          </p>
          {tags.length === 0 ? (
            <p className="text-text-disabled text-sm">No tags created</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => {
                const tagMissionCount = missions.filter(
                  (m) => m.tagId === tag.id
                ).length;
                return (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-text-secondary">{tag.name}</span>
                    </div>
                    <span className="text-text-disabled text-xs">
                      {tagMissionCount}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel - Mission List */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h1>
            <p className="text-text-secondary">
              {filteredMissions.length} mission
              {filteredMissions.length !== 1 ? "s" : ""}
              {selectedTag && (
                <span className="ml-1">
                  in{" "}
                  <span style={{ color: selectedTag.color }}>
                    {selectedTag.name}
                  </span>
                </span>
              )}
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Mission
          </motion.button>
        </div>

        {/* Mission List or Empty State */}
        {filteredMissions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-surface flex items-center justify-center mb-6">
              <Calendar className="w-10 h-10 text-text-disabled" />
            </div>
            <h3 className="text-xl font-semibold text-text-secondary mb-2">
              No missions for this day
            </h3>
            <p className="text-text-disabled mb-6">
              {selectedTag
                ? `No ${selectedTag.name} missions scheduled`
                : "Create your first mission to get started"}
            </p>
            {missions.length === 0 && (
              <button
                onClick={() => loadSeedData()}
                className="px-4 py-2 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Load sample missions
              </button>
            )}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-xl transition-colors mt-4"
            >
              <Plus className="w-5 h-5" />
              Create your first mission
            </motion.button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredMissions.map((mission, index) => {
                const tag = tags.find((t) => t.id === mission.tagId);
                const isDragging = draggedMissionId === mission.id;
                const isDragOver = dragOverMissionId === mission.id;

                return (
                  <motion.div
                    key={mission.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isDragOver ? 1.02 : 1,
                    }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.03 }}
                    draggable
                    onDragStart={() => handleDragStart(mission.id)}
                    onDragOver={(e) => handleDragOver(e, mission.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "transition-all",
                      isDragging && "opacity-50",
                      isDragOver && "ring-2 ring-accent ring-offset-2 ring-offset-void rounded-xl"
                    )}
                  >
                    <MissionCard
                      mission={mission}
                      tag={tag}
                      isDragging={isDragging}
                      dragHandleProps={{
                        onMouseDown: (e) => e.stopPropagation(),
                      }}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
