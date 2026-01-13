"use client";

import { memo, useState, useRef, useEffect, useCallback } from "react";
import {
  Handle,
  Position,
  type NodeProps,
  type Node,
  NodeResizer,
  useReactFlow,
} from "@xyflow/react";
import { motion, AnimatePresence } from "framer-motion";
import { StickyNote, X, Palette } from "lucide-react";
import { cn } from "@/lib/utils";

export type StickyNoteColor = "yellow" | "blue" | "green" | "pink" | "purple";

export interface StickyNoteNodeData extends Record<string, unknown> {
  content: string;
  color: StickyNoteColor;
  onDelete?: (nodeId: string) => void;
  onUpdate?: (nodeId: string, data: Partial<StickyNoteNodeData>) => void;
}

type StickyNoteNodeType = Node<StickyNoteNodeData, "stickyNote">;

// Dark/muted color variants for dark theme
const colorStyles: Record<StickyNoteColor, { bg: string; text: string; border: string }> = {
  yellow: { bg: "#3D3A20", text: "#F5E6A3", border: "#5C572E" },
  blue: { bg: "#1E2A3D", text: "#A3C9F5", border: "#2E4A6C" },
  green: { bg: "#1E3D2A", text: "#A3F5C9", border: "#2E6C4A" },
  pink: { bg: "#3D1E2A", text: "#F5A3C9", border: "#6C2E4A" },
  purple: { bg: "#2A1E3D", text: "#C9A3F5", border: "#4A2E6C" },
};

const colorOptions: StickyNoteColor[] = ["yellow", "blue", "green", "pink", "purple"];

function StickyNoteNodeComponent({ id, data, selected }: NodeProps<StickyNoteNodeType>) {
  const { setNodes, deleteElements } = useReactFlow();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(data.content);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  const colorStyle = colorStyles[data.color || "yellow"];

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as HTMLElement)) {
        setShowColorPicker(false);
      }
    };
    if (showColorPicker) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showColorPicker]);

  // Handle double click to edit
  const handleDoubleClick = useCallback(() => {
    setIsEditing(true);
    setEditContent(data.content);
  }, [data.content]);

  // Save content
  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editContent !== data.content) {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id
            ? { ...node, data: { ...node.data, content: editContent } }
            : node
        )
      );
      data.onUpdate?.(id, { content: editContent });
    }
  }, [id, editContent, data, setNodes]);

  // Handle blur
  const handleBlur = useCallback(() => {
    handleSave();
  }, [handleSave]);

  // Handle key down
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsEditing(false);
        setEditContent(data.content);
      }
      // Allow Enter for new lines, Cmd/Ctrl+Enter to save
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        handleSave();
      }
    },
    [data.content, handleSave]
  );

  // Change color
  const handleColorChange = useCallback(
    (color: StickyNoteColor) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === id ? { ...node, data: { ...node.data, color } } : node
        )
      );
      data.onUpdate?.(id, { color });
      setShowColorPicker(false);
    },
    [id, data, setNodes]
  );

  // Delete node
  const handleDelete = useCallback(() => {
    deleteElements({ nodes: [{ id }] });
    data.onDelete?.(id);
  }, [id, deleteElements, data]);

  return (
    <>
      {/* Node Resizer */}
      <NodeResizer
        minWidth={150}
        minHeight={150}
        maxWidth={400}
        maxHeight={400}
        isVisible={selected}
        lineClassName="!border-accent"
        handleClassName="!w-2 !h-2 !bg-accent !border-0"
      />

      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2 !h-2 !bg-transparent !border-0"
      />

      {/* Sticky Note Card */}
      <div
        className={cn(
          "w-full h-full min-w-[150px] min-h-[150px] rounded p-3 transition-all relative",
          selected && "ring-2 ring-accent ring-offset-2 ring-offset-void"
        )}
        style={{
          backgroundColor: colorStyle.bg,
          borderColor: colorStyle.border,
          borderWidth: 1,
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={handleDoubleClick}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          {/* Note icon */}
          <StickyNote
            className="w-4 h-4"
            style={{ color: colorStyle.text, opacity: 0.6 }}
          />

          {/* Action buttons - visible on hover or selected */}
          <AnimatePresence>
            {(isHovered || selected) && !isEditing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1"
              >
                {/* Color picker button */}
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="p-1 rounded hover:bg-white/10 transition-colors"
                  title="Change color"
                >
                  <Palette
                    className="w-3.5 h-3.5"
                    style={{ color: colorStyle.text }}
                  />
                </button>

                {/* Delete button */}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1 rounded hover:bg-red-500/20 transition-colors"
                  title="Delete note"
                >
                  <X
                    className="w-3.5 h-3.5"
                    style={{ color: colorStyle.text }}
                  />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Content */}
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="w-full h-[calc(100%-28px)] bg-transparent border-0 outline-none resize-none text-sm leading-relaxed"
            style={{ color: colorStyle.text }}
            placeholder="Write your note..."
          />
        ) : (
          <p
            className="text-sm leading-relaxed whitespace-pre-wrap overflow-auto h-[calc(100%-28px)]"
            style={{ color: colorStyle.text }}
          >
            {data.content || "Double-click to edit..."}
          </p>
        )}

        {/* Color Picker Popover */}
        <AnimatePresence>
          {showColorPicker && (
            <motion.div
              ref={colorPickerRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-10 right-0 bg-surface border border-border-subtle rounded-lg p-2 shadow-xl z-50"
            >
              <div className="flex gap-1.5">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      "w-6 h-6 rounded-full transition-all",
                      data.color === color && "ring-2 ring-white ring-offset-2 ring-offset-surface"
                    )}
                    style={{ backgroundColor: colorStyles[color].bg, border: `2px solid ${colorStyles[color].border}` }}
                    title={color}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-void/90 rounded flex flex-col items-center justify-center gap-3 z-50"
            >
              <p className="text-sm text-text-primary">Delete this note?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-3 py-1.5 text-xs bg-surface-hover text-text-secondary rounded hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1.5 text-xs bg-status-bottleneck/20 text-status-bottleneck rounded hover:bg-status-bottleneck/30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !bg-transparent !border-0"
      />
    </>
  );
}

export const StickyNoteNode = memo(StickyNoteNodeComponent);
