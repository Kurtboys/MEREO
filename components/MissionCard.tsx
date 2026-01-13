"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  GripVertical,
  X,
  Plus,
  Pencil,
  Calendar,
  Trash2,
} from "lucide-react";
import { format, addDays, subDays } from "date-fns";
import { useMereoStore } from "@/lib/store";
import { cn, formatDateKey } from "@/lib/utils";
import type { Mission, Tag, Checkpoint } from "@/lib/types";

interface MissionCardProps {
  mission: Mission;
  tag: Tag | undefined;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
}

export function MissionCard({
  mission,
  tag,
  isDragging = false,
  dragHandleProps,
}: MissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [editingCheckpointTime, setEditingCheckpointTime] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const {
    updateMission,
    deleteMission,
    addCheckpoint,
    updateCheckpoint,
    deleteCheckpoint,
  } = useMereoStore();

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
        setShowDeleteConfirm(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================
  // Title Editing
  // ============================================
  const handleTitleSave = useCallback(
    (newTitle: string) => {
      if (newTitle.trim() && newTitle !== mission.title) {
        updateMission(mission.id, { title: newTitle.trim() });
      }
      setEditingTitle(false);
    },
    [mission.id, mission.title, updateMission]
  );

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      handleTitleSave(e.currentTarget.value);
    } else if (e.key === "Escape") {
      setEditingTitle(false);
    }
  };

  // ============================================
  // Checkpoint Editing
  // ============================================
  const handleCheckpointTitleSave = useCallback(
    (checkpointId: string, newTitle: string) => {
      if (newTitle.trim()) {
        updateCheckpoint(mission.id, checkpointId, { title: newTitle.trim() });
      }
      setEditingCheckpointId(null);
    },
    [mission.id, updateCheckpoint]
  );

  const handleCheckpointTimeSave = useCallback(
    (checkpointId: string, newTime: string) => {
      const minutes = parseInt(newTime, 10);
      if (!isNaN(minutes) && minutes > 0) {
        updateCheckpoint(mission.id, checkpointId, { estimatedMinutes: minutes });
      }
      setEditingCheckpointTime(null);
    },
    [mission.id, updateCheckpoint]
  );

  const handleAddCheckpoint = () => {
    addCheckpoint(mission.id, {
      title: "New checkpoint",
      estimatedMinutes: 15,
      isComplete: false,
      order: mission.checkpoints.length,
    });
  };

  const handleDeleteCheckpoint = (checkpointId: string) => {
    deleteCheckpoint(mission.id, checkpointId);
  };

  // ============================================
  // Mission Actions
  // ============================================
  const handleMoveToDate = (newDate: Date) => {
    updateMission(mission.id, { scheduledDate: formatDateKey(newDate) });
    setShowDatePicker(false);
  };

  const handleDeleteMission = () => {
    deleteMission(mission.id);
    setShowDeleteConfirm(false);
  };

  // ============================================
  // Render
  // ============================================
  return (
    <motion.div
      ref={cardRef}
      layout
      className={cn(
        "bg-surface rounded-xl border border-border-subtle overflow-hidden transition-shadow group",
        isDragging && "shadow-xl ring-2 ring-accent",
        isExpanded && "ring-1 ring-border-subtle"
      )}
    >
      {/* Card Container with Tag Color Bar */}
      <div className="flex">
        {/* Tag Color Bar */}
        <div
          className="w-1 shrink-0"
          style={{ backgroundColor: tag?.color || "#3B82F6" }}
        />

        {/* Card Content */}
        <div className="flex-1 p-4">
          {/* Header Row */}
          <div className="flex items-start gap-3">
            {/* Drag Handle */}
            {dragHandleProps && (
              <div
                {...dragHandleProps}
                className="mt-1 cursor-grab active:cursor-grabbing text-text-disabled hover:text-text-secondary transition-colors"
              >
                <GripVertical className="w-4 h-4" />
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Title Row */}
              <div className="flex items-center gap-3 mb-1">
                {editingTitle ? (
                  <input
                    ref={titleInputRef}
                    type="text"
                    defaultValue={mission.title}
                    onBlur={(e) => handleTitleSave(e.target.value)}
                    onKeyDown={handleTitleKeyDown}
                    className="flex-1 text-lg font-black bg-void border border-accent rounded px-2 py-1 focus:outline-none"
                  />
                ) : (
                  <h3
                    className="text-lg font-black truncate cursor-pointer hover:text-accent transition-colors"
                    onClick={() => setEditingTitle(true)}
                  >
                    {mission.title}
                  </h3>
                )}

                {tag && (
                  <span
                    className="shrink-0 px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: tag.color + "20",
                      color: tag.color,
                    }}
                  >
                    {tag.name}
                  </span>
                )}
              </div>

              {/* Meta Row */}
              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <span className="font-mono font-light">{mission.totalEstimatedMinutes} min</span>
                <span>{mission.checkpoints.length} checkpoints</span>
                {mission.status !== "scheduled" && (
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      mission.status === "completed" &&
                        "bg-status-success/20 text-status-success",
                      mission.status === "active" && "bg-accent/20 text-accent",
                      mission.status === "bottleneck" &&
                        "bg-status-bottleneck/20 text-status-bottleneck"
                    )}
                  >
                    {mission.status}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-text-disabled hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil className="w-4 h-4" />
              </button>

              {/* Move Date */}
              <div className="relative">
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="p-2 text-text-disabled hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors"
                  title="Move to date"
                >
                  <Calendar className="w-4 h-4" />
                </button>

                {/* Date Picker Popover */}
                <AnimatePresence>
                  {showDatePicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-surface border border-border-subtle rounded-lg shadow-xl z-20 p-3 min-w-[200px]"
                    >
                      <p className="text-xs text-text-disabled mb-2">Move to:</p>
                      <div className="space-y-1">
                        <button
                          onClick={() => handleMoveToDate(new Date())}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          Today
                        </button>
                        <button
                          onClick={() => handleMoveToDate(addDays(new Date(), 1))}
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          Tomorrow
                        </button>
                        <button
                          onClick={() =>
                            handleMoveToDate(
                              addDays(new Date(mission.scheduledDate), 1)
                            )
                          }
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          +1 Day
                        </button>
                        <button
                          onClick={() =>
                            handleMoveToDate(
                              subDays(new Date(mission.scheduledDate), 1)
                            )
                          }
                          className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          -1 Day
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Delete */}
              <div className="relative">
                <button
                  onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                  className="p-2 text-text-disabled hover:text-status-bottleneck hover:bg-status-bottleneck/10 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Delete Confirmation Popover */}
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 bg-surface border border-border-subtle rounded-lg shadow-xl z-20 p-4 min-w-[220px]"
                    >
                      <p className="text-sm mb-3">Delete this mission?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowDeleteConfirm(false)}
                          className="flex-1 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface-hover transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteMission}
                          className="flex-1 px-3 py-2 text-sm bg-status-bottleneck text-void font-medium rounded-lg hover:bg-status-bottleneck/90 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Expand/Collapse Chevron */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 text-text-disabled hover:text-text-primary transition-colors"
            >
              <ChevronDown
                className={cn(
                  "w-5 h-5 transition-transform",
                  isExpanded && "rotate-180"
                )}
              />
            </button>
          </div>

          {/* Expanded Content - Checkpoints */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-border-subtle space-y-2">
                  {mission.checkpoints
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((checkpoint) => (
                      <CheckpointRow
                        key={checkpoint.id}
                        checkpoint={checkpoint}
                        isEditingTitle={editingCheckpointId === checkpoint.id}
                        isEditingTime={editingCheckpointTime === checkpoint.id}
                        onEditTitle={() => setEditingCheckpointId(checkpoint.id)}
                        onEditTime={() => setEditingCheckpointTime(checkpoint.id)}
                        onSaveTitle={(title) =>
                          handleCheckpointTitleSave(checkpoint.id, title)
                        }
                        onSaveTime={(time) =>
                          handleCheckpointTimeSave(checkpoint.id, time)
                        }
                        onCancelEdit={() => {
                          setEditingCheckpointId(null);
                          setEditingCheckpointTime(null);
                        }}
                        onDelete={() => handleDeleteCheckpoint(checkpoint.id)}
                      />
                    ))}

                  {/* Add Checkpoint Button */}
                  <button
                    onClick={handleAddCheckpoint}
                    className="w-full flex items-center justify-center gap-2 py-3 text-sm text-text-secondary hover:text-accent border border-dashed border-border-subtle hover:border-accent rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add Checkpoint
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================
// Checkpoint Row Component
// ============================================
interface CheckpointRowProps {
  checkpoint: Checkpoint;
  isEditingTitle: boolean;
  isEditingTime: boolean;
  onEditTitle: () => void;
  onEditTime: () => void;
  onSaveTitle: (title: string) => void;
  onSaveTime: (time: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}

function CheckpointRow({
  checkpoint,
  isEditingTitle,
  isEditingTime,
  onEditTitle,
  onEditTime,
  onSaveTitle,
  onSaveTime,
  onCancelEdit,
  onDelete,
}: CheckpointRowProps) {
  const titleInputRef = useRef<HTMLInputElement>(null);
  const timeInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isEditingTitle]);

  useEffect(() => {
    if (isEditingTime && timeInputRef.current) {
      timeInputRef.current.focus();
      timeInputRef.current.select();
    }
  }, [isEditingTime]);

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onSaveTitle(e.currentTarget.value);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      onSaveTime(e.currentTarget.value);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-void/50 group/checkpoint">
      {/* Drag Handle */}
      <div className="text-text-disabled cursor-grab active:cursor-grabbing">
        <GripVertical className="w-3 h-3" />
      </div>

      {/* Checkbox indicator */}
      <div
        className={cn(
          "w-4 h-4 rounded border flex items-center justify-center shrink-0",
          checkpoint.isComplete
            ? "border-status-success bg-status-success/20"
            : "border-border-subtle"
        )}
      >
        {checkpoint.isComplete && (
          <span className="w-2 h-2 rounded-sm bg-status-success" />
        )}
      </div>

      {/* Title */}
      {isEditingTitle ? (
        <input
          ref={titleInputRef}
          type="text"
          defaultValue={checkpoint.title}
          onBlur={(e) => onSaveTitle(e.target.value)}
          onKeyDown={handleTitleKeyDown}
          className="flex-1 text-sm bg-void border border-accent rounded px-2 py-1 focus:outline-none"
        />
      ) : (
        <span
          className={cn(
            "flex-1 text-sm cursor-pointer hover:text-accent transition-colors",
            checkpoint.isComplete && "line-through text-text-disabled"
          )}
          onClick={onEditTitle}
        >
          {checkpoint.title}
        </span>
      )}

      {/* Time */}
      {isEditingTime ? (
        <input
          ref={timeInputRef}
          type="number"
          min="1"
          defaultValue={checkpoint.estimatedMinutes}
          onBlur={(e) => onSaveTime(e.target.value)}
          onKeyDown={handleTimeKeyDown}
          className="w-16 text-sm text-right bg-void border border-accent rounded px-2 py-1 focus:outline-none font-mono font-light"
        />
      ) : (
        <span
          className="text-sm text-text-disabled font-mono font-light cursor-pointer hover:text-accent transition-colors"
          onClick={onEditTime}
        >
          {checkpoint.estimatedMinutes}m
        </span>
      )}

      {/* Delete Button */}
      <button
        onClick={onDelete}
        className="opacity-0 group-hover/checkpoint:opacity-100 p-1 text-text-disabled hover:text-status-bottleneck transition-all"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
