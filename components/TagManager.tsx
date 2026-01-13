"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Plus, Check } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

interface TagManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

// Dark-mode friendly color palette
const TAG_COLORS = [
  // Blues
  "#3B82F6",
  "#60A5FA",
  "#2563EB",
  // Greens
  "#10B981",
  "#34D399",
  "#059669",
  // Ambers/Yellows
  "#F59E0B",
  "#FBBF24",
  "#D97706",
  // Reds
  "#EF4444",
  "#F87171",
  "#DC2626",
  // Purples
  "#8B5CF6",
  "#A78BFA",
  "#7C3AED",
  // Pinks
  "#EC4899",
  "#F472B6",
  "#DB2777",
  // Cyans
  "#06B6D4",
  "#22D3EE",
  "#0891B2",
  // Oranges
  "#F97316",
  "#FB923C",
  "#EA580C",
  // Grays
  "#6B7280",
  "#9CA3AF",
  "#4B5563",
];

export function TagManager({ isOpen, onClose }: TagManagerProps) {
  const { tags, missions, addTag, updateTag, deleteTag } = useMereoStore();

  // New tag state
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);

  // Editing state
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [colorPickerTagId, setColorPickerTagId] = useState<string | null>(null);
  const [deleteConfirmTagId, setDeleteConfirmTagId] = useState<string | null>(null);

  // Refs
  const modalRef = useRef<HTMLDivElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setNewTagName("");
      setNewTagColor(TAG_COLORS[0]);
      setEditingTagId(null);
      setColorPickerTagId(null);
      setDeleteConfirmTagId(null);
    }
  }, [isOpen]);

  // Focus edit input when editing starts
  useEffect(() => {
    if (editingTagId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTagId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (colorPickerTagId) {
          setColorPickerTagId(null);
        } else if (deleteConfirmTagId) {
          setDeleteConfirmTagId(null);
        } else if (editingTagId) {
          setEditingTagId(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, colorPickerTagId, deleteConfirmTagId, editingTagId]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-color-picker]")) {
        setColorPickerTagId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get mission count for a tag
  const getMissionCount = (tagId: string): number => {
    return missions.filter((m) => m.tagId === tagId).length;
  };

  // Handle tag name save
  const handleSaveTagName = (tagId: string, newName: string) => {
    if (newName.trim()) {
      updateTag(tagId, { name: newName.trim() });
    }
    setEditingTagId(null);
  };

  // Handle tag color change
  const handleColorChange = (tagId: string, color: string) => {
    updateTag(tagId, { color });
    setColorPickerTagId(null);
  };

  // Handle tag delete
  const handleDeleteTag = (tagId: string) => {
    // Update missions that use this tag to have no tag (or first available tag)
    const firstOtherTag = tags.find((t) => t.id !== tagId);
    missions
      .filter((m) => m.tagId === tagId)
      .forEach((mission) => {
        // Note: This would need a store action to batch update missions
        // For now, we just delete the tag
      });

    deleteTag(tagId);
    setDeleteConfirmTagId(null);
  };

  // Handle create new tag
  const handleCreateTag = () => {
    if (newTagName.trim()) {
      addTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      setNewTagName("");
      setNewTagColor(TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)]);
    }
  };

  if (!isOpen) return null;

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
        <div
          ref={modalRef}
          className="w-full max-w-[450px] bg-surface border border-border-subtle rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-subtle">
            <h2 className="text-xl font-bold">Manage Tags</h2>
            <button
              onClick={onClose}
              className="p-2 text-text-disabled hover:text-text-primary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tag List */}
          <div className="max-h-[400px] overflow-y-auto">
            {tags.length === 0 ? (
              <div className="p-8 text-center text-text-disabled">
                No tags created yet. Create your first tag below.
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {tags.map((tag) => (
                  <TagListItem
                    key={tag.id}
                    tag={tag}
                    missionCount={getMissionCount(tag.id)}
                    isEditing={editingTagId === tag.id}
                    showColorPicker={colorPickerTagId === tag.id}
                    showDeleteConfirm={deleteConfirmTagId === tag.id}
                    editInputRef={editingTagId === tag.id ? editInputRef : null}
                    onStartEdit={() => setEditingTagId(tag.id)}
                    onSaveEdit={(name) => handleSaveTagName(tag.id, name)}
                    onCancelEdit={() => setEditingTagId(null)}
                    onOpenColorPicker={() => setColorPickerTagId(tag.id)}
                    onCloseColorPicker={() => setColorPickerTagId(null)}
                    onColorChange={(color) => handleColorChange(tag.id, color)}
                    onOpenDeleteConfirm={() => setDeleteConfirmTagId(tag.id)}
                    onCloseDeleteConfirm={() => setDeleteConfirmTagId(null)}
                    onConfirmDelete={() => handleDeleteTag(tag.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Create New Tag */}
          <div className="p-6 border-t border-border-subtle bg-void/30">
            <h3 className="text-sm font-medium text-text-secondary mb-4">
              Create New Tag
            </h3>

            <div className="flex items-center gap-3">
              {/* Color Picker */}
              <div className="relative" data-color-picker>
                <button
                  onClick={() =>
                    setColorPickerTagId(
                      colorPickerTagId === "new" ? null : "new"
                    )
                  }
                  className="w-10 h-10 rounded-full border-2 border-border-subtle hover:border-accent transition-colors"
                  style={{ backgroundColor: newTagColor }}
                />

                <AnimatePresence>
                  {colorPickerTagId === "new" && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute bottom-full left-0 mb-2 p-3 bg-surface border border-border-subtle rounded-xl shadow-xl z-10"
                    >
                      <div className="grid grid-cols-6 gap-2">
                        {TAG_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => {
                              setNewTagColor(color);
                              setColorPickerTagId(null);
                            }}
                            className={cn(
                              "w-7 h-7 rounded-full transition-all",
                              newTagColor === color &&
                                "ring-2 ring-offset-2 ring-offset-surface ring-white"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Name Input */}
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTagName.trim()) {
                    handleCreateTag();
                  }
                }}
                placeholder="Tag name"
                className="flex-1 px-4 py-2.5 bg-surface border border-border-subtle rounded-xl text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-accent transition-colors"
              />

              {/* Add Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateTag}
                disabled={!newTagName.trim()}
                className="flex items-center gap-2 px-4 py-2.5 bg-accent hover:bg-accent-hover text-void font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Add
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}

// ============================================
// Tag List Item Component
// ============================================
interface TagListItemProps {
  tag: Tag;
  missionCount: number;
  isEditing: boolean;
  showColorPicker: boolean;
  showDeleteConfirm: boolean;
  editInputRef: React.RefObject<HTMLInputElement | null> | null;
  onStartEdit: () => void;
  onSaveEdit: (name: string) => void;
  onCancelEdit: () => void;
  onOpenColorPicker: () => void;
  onCloseColorPicker: () => void;
  onColorChange: (color: string) => void;
  onOpenDeleteConfirm: () => void;
  onCloseDeleteConfirm: () => void;
  onConfirmDelete: () => void;
}

function TagListItem({
  tag,
  missionCount,
  isEditing,
  showColorPicker,
  showDeleteConfirm,
  editInputRef,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onOpenColorPicker,
  onCloseColorPicker,
  onColorChange,
  onOpenDeleteConfirm,
  onCloseDeleteConfirm,
  onConfirmDelete,
}: TagListItemProps) {
  const [editValue, setEditValue] = useState(tag.name);

  // Reset edit value when tag changes or editing starts
  useEffect(() => {
    setEditValue(tag.name);
  }, [tag.name, isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onSaveEdit(editValue);
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-surface-hover group transition-colors">
      {/* Color Swatch */}
      <div className="relative" data-color-picker>
        <button
          onClick={onOpenColorPicker}
          className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white/30 transition-colors"
          style={{ backgroundColor: tag.color }}
          title="Change color"
        />

        <AnimatePresence>
          {showColorPicker && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 mt-2 p-3 bg-surface border border-border-subtle rounded-xl shadow-xl z-10"
            >
              <div className="grid grid-cols-6 gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => onColorChange(color)}
                    className={cn(
                      "w-7 h-7 rounded-full transition-all",
                      tag.color === color &&
                        "ring-2 ring-offset-2 ring-offset-surface ring-white"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tag Name */}
      {isEditing ? (
        <input
          ref={editInputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={() => onSaveEdit(editValue)}
          onKeyDown={handleKeyDown}
          className="flex-1 px-2 py-1 bg-void border border-accent rounded text-text-primary focus:outline-none"
        />
      ) : (
        <span
          className="flex-1 text-text-primary cursor-pointer hover:text-accent transition-colors"
          onClick={onStartEdit}
        >
          {tag.name}
        </span>
      )}

      {/* Mission Count */}
      <span className="text-sm text-text-disabled">
        {missionCount} mission{missionCount !== 1 ? "s" : ""}
      </span>

      {/* Delete Button */}
      <div className="relative">
        <button
          onClick={onOpenDeleteConfirm}
          className="p-2 text-text-disabled hover:text-status-bottleneck opacity-0 group-hover:opacity-100 transition-all"
          title="Delete tag"
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
              className="absolute right-0 top-full mt-2 p-4 bg-surface border border-border-subtle rounded-xl shadow-xl z-10 min-w-[240px]"
            >
              {missionCount > 0 ? (
                <>
                  <p className="text-sm mb-3">
                    This tag is used by{" "}
                    <span className="font-semibold text-status-bottleneck">
                      {missionCount} mission{missionCount !== 1 ? "s" : ""}
                    </span>
                    . They will become untagged.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={onCloseDeleteConfirm}
                      className="flex-1 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirmDelete}
                      className="flex-1 px-3 py-2 text-sm bg-status-bottleneck text-void font-medium rounded-lg hover:bg-status-bottleneck/90 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm mb-3">Delete this tag?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onCloseDeleteConfirm}
                      className="flex-1 px-3 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface-hover transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onConfirmDelete}
                      className="flex-1 px-3 py-2 text-sm bg-status-bottleneck text-void font-medium rounded-lg hover:bg-status-bottleneck/90 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
