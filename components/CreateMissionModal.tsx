"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  X,
  Plus,
  ChevronRight,
  ChevronLeft,
  Check,
  Tag as TagIcon,
} from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { formatDateKey, cn, generateId } from "@/lib/utils";
import { MiniCalendar } from "./MiniCalendar";
import type { Checkpoint } from "@/lib/types";

interface CreateMissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: Date;
}

interface DraftCheckpoint {
  id: string;
  title: string;
  estimatedMinutes: number;
}

// Predefined colors for tags
const TAG_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#84CC16", // Lime
  "#6366F1", // Indigo
];

// Format duration as Xh Ym
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function CreateMissionModal({
  isOpen,
  onClose,
  initialDate = new Date(),
}: CreateMissionModalProps) {
  const { tags, addTag, addMission, missions } = useMereoStore();

  // Step state
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for back

  // Form state
  const [missionTitle, setMissionTitle] = useState("");
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [checkpoints, setCheckpoints] = useState<DraftCheckpoint[]>([
    { id: generateId(), title: "", estimatedMinutes: 30 },
  ]);
  const [scheduledDate, setScheduledDate] = useState(initialDate);

  // Tag creation state
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [creatingTag, setCreatingTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setDirection(1);
      setMissionTitle("");
      setSelectedTagId(tags.length > 0 ? tags[0].id : null);
      setCheckpoints([{ id: generateId(), title: "", estimatedMinutes: 30 }]);
      setScheduledDate(initialDate);
      setShowSuccess(false);
      setCreatingTag(false);
      // Focus title input after a short delay
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen, initialDate, tags]);

  // Close tag dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(e.target as Node)
      ) {
        setShowTagDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (creatingTag) {
          setCreatingTag(false);
        } else if (showTagDropdown) {
          setShowTagDropdown(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, creatingTag, showTagDropdown]);

  // Get dates with missions for calendar
  const datesWithMissions = useMemo(() => {
    const dates = new Set<string>();
    missions.forEach((m) => dates.add(m.scheduledDate));
    return Array.from(dates);
  }, [missions]);

  // Calculate total time
  const totalMinutes = useMemo(() => {
    return checkpoints.reduce((sum, cp) => sum + cp.estimatedMinutes, 0);
  }, [checkpoints]);

  // Get selected tag
  const selectedTag = selectedTagId
    ? tags.find((t) => t.id === selectedTagId)
    : null;

  // Validation
  const canProceedStep1 = missionTitle.trim().length > 0;
  const canProceedStep2 =
    checkpoints.length > 0 &&
    checkpoints.some((cp) => cp.title.trim().length > 0);

  // ============================================
  // Handlers
  // ============================================
  const handleNextStep = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  };

  const handlePrevStep = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleAddCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      { id: generateId(), title: "", estimatedMinutes: 30 },
    ]);
  };

  const handleRemoveCheckpoint = (id: string) => {
    if (checkpoints.length > 1) {
      setCheckpoints(checkpoints.filter((cp) => cp.id !== id));
    }
  };

  const handleCheckpointChange = (
    id: string,
    field: "title" | "estimatedMinutes",
    value: string | number
  ) => {
    setCheckpoints(
      checkpoints.map((cp) =>
        cp.id === id ? { ...cp, [field]: value } : cp
      )
    );
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      const newTag = addTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setSelectedTagId(newTag.id);
      setCreatingTag(false);
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      setShowTagDropdown(false);
    }
  };

  const handleCreateMission = () => {
    // Filter out empty checkpoints
    const validCheckpoints = checkpoints.filter(
      (cp) => cp.title.trim().length > 0
    );

    if (!missionTitle.trim() || validCheckpoints.length === 0) return;

    // Get order for new mission
    const dateKey = formatDateKey(scheduledDate);
    const existingMissions = missions.filter(
      (m) => m.scheduledDate === dateKey
    );
    const maxOrder = Math.max(...existingMissions.map((m) => m.order), -1);

    // Create mission
    addMission({
      title: missionTitle.trim(),
      tagId: selectedTagId || tags[0]?.id || "",
      checkpoints: validCheckpoints.map(
        (cp, index): Checkpoint => ({
          id: cp.id,
          title: cp.title.trim(),
          estimatedMinutes: cp.estimatedMinutes,
          isComplete: false,
          order: index,
        })
      ),
      totalEstimatedMinutes: totalMinutes, // Will be recalculated by store
      status: "scheduled",
      scheduledDate: dateKey,
      order: maxOrder + 1,
      createdBy: "manual",
    });

    // Show success
    setShowSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  if (!isOpen) return null;

  // ============================================
  // Step Content Variants
  // ============================================
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-void/90 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
      >
        <div className="w-full max-w-[500px] bg-surface border border-border-subtle rounded-2xl shadow-2xl pointer-events-auto overflow-hidden">
          {/* Success State */}
          {showSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-12 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-20 h-20 rounded-full bg-status-success/20 flex items-center justify-center mx-auto mb-6"
              >
                <Check className="w-10 h-10 text-status-success" />
              </motion.div>
              <h2 className="text-2xl font-black mb-2">Mission Created!</h2>
              <p className="text-text-secondary">{missionTitle}</p>
            </motion.div>
          ) : (
            <>
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border-subtle">
                <div>
                  <h2 className="text-xl font-black">Create Mission</h2>
                  <p className="text-sm text-text-secondary">
                    Step {step} of 3
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 text-text-disabled hover:text-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-2 py-4 bg-void/30">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      s === step
                        ? "bg-accent"
                        : s < step
                          ? "bg-accent/50"
                          : "bg-border-subtle"
                    )}
                  />
                ))}
              </div>

              {/* Step Content */}
              <div className="relative overflow-hidden" style={{ minHeight: 320 }}>
                <AnimatePresence mode="wait" custom={direction}>
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      <h3 className="text-lg font-semibold mb-6">
                        What&apos;s the mission?
                      </h3>

                      {/* Mission Title */}
                      <div className="mb-6">
                        <label className="text-sm text-text-secondary mb-2 block">
                          Mission Title
                        </label>
                        <input
                          ref={titleInputRef}
                          type="text"
                          value={missionTitle}
                          onChange={(e) => setMissionTitle(e.target.value)}
                          placeholder="e.g., Client Proposal Draft"
                          className="w-full px-4 py-3 bg-void border border-border-subtle rounded-xl text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
                        />
                      </div>

                      {/* Tag Selector */}
                      <div className="relative" ref={tagDropdownRef}>
                        <label className="text-sm text-text-secondary mb-2 block">
                          Category (Tag)
                        </label>

                        {creatingTag ? (
                          // Inline Tag Creation
                          <div className="p-4 bg-void border border-accent rounded-xl">
                            <input
                              type="text"
                              value={newTagName}
                              onChange={(e) => setNewTagName(e.target.value)}
                              placeholder="Tag name"
                              autoFocus
                              className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors mb-3"
                            />

                            {/* Color Picker */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {TAG_COLORS.map((color) => (
                                <button
                                  key={color}
                                  onClick={() => setNewTagColor(color)}
                                  className={cn(
                                    "w-7 h-7 rounded-full transition-all",
                                    newTagColor === color &&
                                      "ring-2 ring-offset-2 ring-offset-void ring-white"
                                  )}
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setCreatingTag(false)}
                                className="flex-1 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface-hover transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleCreateTag}
                                disabled={!newTagName.trim()}
                                className="flex-1 px-3 py-2 text-sm bg-accent text-void font-medium rounded-lg hover:bg-accent-hover transition-colors disabled:opacity-50"
                              >
                                Create Tag
                              </button>
                            </div>
                          </div>
                        ) : (
                          // Tag Dropdown Button
                          <button
                            onClick={() => setShowTagDropdown(!showTagDropdown)}
                            className={cn(
                              "w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors",
                              showTagDropdown
                                ? "border-accent bg-void"
                                : "border-border-subtle hover:border-text-disabled bg-void"
                            )}
                          >
                            {selectedTag ? (
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: selectedTag.color }}
                                />
                                <span>{selectedTag.name}</span>
                              </div>
                            ) : (
                              <span className="text-text-disabled">
                                Select a tag...
                              </span>
                            )}
                            <ChevronRight
                              className={cn(
                                "w-4 h-4 text-text-secondary transition-transform",
                                showTagDropdown && "rotate-90"
                              )}
                            />
                          </button>
                        )}

                        {/* Dropdown Menu */}
                        <AnimatePresence>
                          {showTagDropdown && !creatingTag && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 mt-2 bg-surface border border-border-subtle rounded-xl shadow-xl z-10 overflow-hidden max-h-[200px] overflow-y-auto"
                            >
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
                                      : "hover:bg-surface-hover"
                                  )}
                                >
                                  <span
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: tag.color }}
                                  />
                                  <span>{tag.name}</span>
                                </button>
                              ))}

                              {/* Create New Tag Option */}
                              <button
                                onClick={() => {
                                  setCreatingTag(true);
                                  setShowTagDropdown(false);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-3 text-left text-accent hover:bg-accent/10 transition-colors border-t border-border-subtle"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Create new tag...</span>
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      <h3 className="text-lg font-semibold mb-6">
                        Break it into checkpoints
                      </h3>

                      {/* Checkpoint List */}
                      <div className="space-y-3 mb-4 max-h-[200px] overflow-y-auto">
                        {checkpoints.map((cp, index) => (
                          <CheckpointInput
                            key={cp.id}
                            checkpoint={cp}
                            index={index}
                            onTitleChange={(title) =>
                              handleCheckpointChange(cp.id, "title", title)
                            }
                            onTimeChange={(time) =>
                              handleCheckpointChange(
                                cp.id,
                                "estimatedMinutes",
                                time
                              )
                            }
                            onRemove={() => handleRemoveCheckpoint(cp.id)}
                            canRemove={checkpoints.length > 1}
                          />
                        ))}
                      </div>

                      {/* Add Checkpoint Button */}
                      <button
                        onClick={handleAddCheckpoint}
                        className="w-full flex items-center justify-center gap-2 py-3 text-sm text-text-secondary hover:text-accent border border-dashed border-border-subtle hover:border-accent rounded-xl transition-colors mb-4"
                      >
                        <Plus className="w-4 h-4" />
                        Add Checkpoint
                      </button>

                      {/* Total Time */}
                      <div className="flex items-center justify-between p-4 bg-void/50 rounded-xl">
                        <span className="text-text-secondary">Total Time</span>
                        <span className="text-lg font-bold text-accent">
                          {formatDuration(totalMinutes)}
                        </span>
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="p-6"
                    >
                      <h3 className="text-lg font-semibold mb-6">When?</h3>

                      {/* Date Picker */}
                      <div className="mb-6">
                        <MiniCalendar
                          selectedDate={scheduledDate}
                          onSelectDate={setScheduledDate}
                          datesWithMissions={datesWithMissions}
                        />
                      </div>

                      {/* Summary */}
                      <div className="p-4 bg-void/50 rounded-xl">
                        <p className="text-xs text-text-disabled uppercase tracking-wide mb-3">
                          Summary
                        </p>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">Mission</span>
                            <span className="font-medium">{missionTitle}</span>
                          </div>
                          {selectedTag && (
                            <div className="flex items-center justify-between">
                              <span className="text-text-secondary">Tag</span>
                              <span
                                className="px-2 py-0.5 rounded text-xs font-medium"
                                style={{
                                  backgroundColor: selectedTag.color + "20",
                                  color: selectedTag.color,
                                }}
                              >
                                {selectedTag.name}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">
                              Checkpoints
                            </span>
                            <span>
                              {checkpoints.filter((cp) => cp.title.trim()).length}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">
                              Total Time
                            </span>
                            <span className="font-mono">
                              {formatDuration(totalMinutes)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-text-secondary">
                              Scheduled
                            </span>
                            <span>
                              {format(scheduledDate, "EEE, MMM d")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between p-6 border-t border-border-subtle">
                {step > 1 ? (
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-2 px-4 py-2 text-text-secondary hover:text-text-primary transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < 3 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleNextStep}
                    disabled={
                      (step === 1 && !canProceedStep1) ||
                      (step === 2 && !canProceedStep2)
                    }
                    className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCreateMission}
                    className="px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-xl transition-colors"
                  >
                    Create Mission
                  </motion.button>
                )}
              </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}

// ============================================
// Checkpoint Input Component
// ============================================
interface CheckpointInputProps {
  checkpoint: DraftCheckpoint;
  index: number;
  onTitleChange: (title: string) => void;
  onTimeChange: (time: number) => void;
  onRemove: () => void;
  canRemove: boolean;
}

function CheckpointInput({
  checkpoint,
  index,
  onTitleChange,
  onTimeChange,
  onRemove,
  canRemove,
}: CheckpointInputProps) {
  const quickTimes = [15, 30, 45, 60];

  return (
    <div className="flex items-center gap-2 p-3 bg-void/50 rounded-xl">
      {/* Number */}
      <span className="w-6 h-6 flex items-center justify-center text-xs text-text-disabled bg-surface rounded">
        {index + 1}
      </span>

      {/* Title Input */}
      <input
        type="text"
        value={checkpoint.title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="Checkpoint title"
        className="flex-1 px-3 py-2 bg-surface border border-border-subtle rounded-lg text-sm focus:outline-none focus:border-accent transition-colors"
      />

      {/* Time Input */}
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="1"
          value={checkpoint.estimatedMinutes}
          onChange={(e) => onTimeChange(parseInt(e.target.value) || 15)}
          className="w-14 px-2 py-2 bg-surface border border-border-subtle rounded-lg text-sm text-center font-mono focus:outline-none focus:border-accent transition-colors"
        />
        <span className="text-xs text-text-disabled">min</span>
      </div>

      {/* Quick Time Buttons */}
      <div className="hidden sm:flex items-center gap-1">
        {quickTimes.map((time) => (
          <button
            key={time}
            onClick={() => onTimeChange(time)}
            className={cn(
              "px-2 py-1 text-xs rounded transition-colors",
              checkpoint.estimatedMinutes === time
                ? "bg-accent text-void"
                : "bg-surface hover:bg-surface-hover text-text-secondary"
            )}
          >
            {time}
          </button>
        ))}
      </div>

      {/* Remove Button */}
      {canRemove && (
        <button
          onClick={onRemove}
          className="p-1.5 text-text-disabled hover:text-status-bottleneck transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
