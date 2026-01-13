"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
  type NodeChange,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Eye, ArrowRight, StickyNote, Link2, Calendar } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString, formatDateDisplay, cn, generateId } from "@/lib/utils";
import { generateWhiteboardLayout, parseNodeId } from "@/lib/whiteboard-layout";
import type { StickyNoteColor } from "@/lib/types";
import {
  MissionNode,
  CheckpointNode,
  StickyNode,
  LinkNode,
  StickyNoteNode,
  LinkCardNode,
  MissionEdge,
  CheckpointEdge,
  AddLinkModal,
  ArchiveDropdown,
} from "@/components/whiteboard";

// Register custom node types
const nodeTypes = {
  mission: MissionNode,
  checkpoint: CheckpointNode,
  sticky: StickyNode,
  link: LinkNode,
  stickyNote: StickyNoteNode,
  linkCard: LinkCardNode,
};

// Register custom edge types
const edgeTypes = {
  mission: MissionEdge,
  checkpoint: CheckpointEdge,
};

// Debounce helper
function useDebouncedCallback<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

// Inner component that uses useReactFlow
function WhiteboardContent() {
  const router = useRouter();
  const reactFlowInstance = useReactFlow();
  const [isClient, setIsClient] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);

  // Date viewing state
  const today = getTodayDateString();
  const [viewingDate, setViewingDate] = useState(today);
  const isReadOnly = viewingDate !== today;

  // Store state
  const {
    currentSession,
    tags,
    whiteboards,
    getMissionsByDate,
    initializeWhiteboard,
    updateNodePosition,
    addStickyNote,
    updateStickyNote,
    deleteStickyNote,
    addLinkCard,
    deleteLinkCard,
  } = useMereoStore();

  // Get missions for the viewing date
  const viewingMissions = useMemo(
    () => getMissionsByDate(viewingDate),
    [getMissionsByDate, viewingDate]
  );
  const whiteboard = whiteboards[viewingDate] || null;

  // Get all whiteboard dates for archive dropdown
  const whiteboardDates = useMemo(() => Object.keys(whiteboards), [whiteboards]);

  // Generate layout from store data
  const { nodes: generatedNodes, edges: generatedEdges } = useMemo(() => {
    if (!isClient) return { nodes: [], edges: [] };
    return generateWhiteboardLayout(viewingMissions, tags, whiteboard);
  }, [isClient, viewingMissions, tags, whiteboard]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(generatedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(generatedEdges);

  // Update nodes when viewing date or data changes
  useEffect(() => {
    if (isClient) {
      const { nodes: newNodes, edges: newEdges } = generateWhiteboardLayout(
        viewingMissions,
        tags,
        whiteboard
      );
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [isClient, viewingMissions, tags, whiteboard, setNodes, setEdges]);

  // Initialize whiteboard for today if it doesn't exist
  useEffect(() => {
    const todayMissions = getMissionsByDate(today);
    if (isClient && currentSession && !whiteboards[today] && todayMissions.length > 0) {
      initializeWhiteboard(today, todayMissions);
    }
  }, [isClient, currentSession, whiteboards, today, getMissionsByDate, initializeWhiteboard]);

  // Handle date selection from archive
  const handleSelectDate = useCallback((date: string) => {
    setViewingDate(date);
  }, []);

  // Return to today
  const handleReturnToToday = useCallback(() => {
    setViewingDate(today);
  }, [today]);

  // Debounced position save (only for today)
  const saveNodePosition = useDebouncedCallback(
    useCallback(
      (nodeId: string, nodeType: "mission" | "checkpoint", position: { x: number; y: number }) => {
        if (!isReadOnly) {
          updateNodePosition(today, nodeId, nodeType, position);
        }
      },
      [today, updateNodePosition, isReadOnly]
    ),
    300
  );

  // Handle node changes with position tracking
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
      // In read-only mode, only allow selection changes
      if (isReadOnly) {
        const allowedChanges = changes.filter(
          (change) => change.type === "select" || change.type === "dimensions"
        );
        onNodesChange(allowedChanges);
        return;
      }

      onNodesChange(changes);

      // Save positions on drag end
      changes.forEach((change) => {
        if (change.type === "position" && change.dragging === false && change.position) {
          const parsed = parseNodeId(change.id);
          if (parsed && (parsed.type === "mission" || parsed.type === "checkpoint")) {
            saveNodePosition(parsed.id, parsed.type as "mission" | "checkpoint", change.position);
          }
        }
      });
    },
    [onNodesChange, saveNodePosition, isReadOnly]
  );

  // Handle edge connections (disabled in read-only mode)
  const onConnect = useCallback(
    (connection: Connection) => {
      if (isReadOnly) return;

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: { stroke: "#6B7280", strokeWidth: 2 },
          },
          eds
        )
      );
    },
    [setEdges, isReadOnly]
  );

  // Get viewport center for adding new nodes
  const getViewportCenter = useCallback(() => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = (-x + window.innerWidth / 2) / zoom;
    const centerY = (-y + window.innerHeight / 2) / zoom;
    return { x: centerX, y: centerY };
  }, [reactFlowInstance]);

  // Add a new sticky note (disabled in read-only mode)
  const handleAddNote = useCallback(() => {
    if (isReadOnly) return;

    const center = getViewportCenter();
    const noteId = generateId();

    // Add to store first
    addStickyNote(today, {
      content: "",
      color: "yellow" as StickyNoteColor,
      position: { x: center.x - 75, y: center.y - 75 },
      size: { width: 150, height: 150 },
    });

    // Add to React Flow nodes
    const newNode: Node = {
      id: `sticky-${noteId}`,
      type: "stickyNote",
      position: { x: center.x - 75, y: center.y - 75 },
      data: {
        content: "",
        color: "yellow",
        onDelete: (id: string) => {
          const parsed = parseNodeId(id);
          if (parsed) deleteStickyNote(today, parsed.id);
        },
        onUpdate: (id: string, data: { content?: string; color?: StickyNoteColor }) => {
          const parsed = parseNodeId(id);
          if (parsed) updateStickyNote(today, parsed.id, data);
        },
      },
      style: { width: 150, height: 150 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [getViewportCenter, today, addStickyNote, deleteStickyNote, updateStickyNote, setNodes, isReadOnly]);

  // Add a new link card (disabled in read-only mode)
  const handleAddLink = useCallback(
    (url: string, title: string) => {
      if (isReadOnly) return;

      const center = getViewportCenter();
      const linkId = generateId();

      // Add to store first
      addLinkCard(today, {
        url,
        title,
        position: { x: center.x - 90, y: center.y - 40 },
      });

      // Add to React Flow nodes
      const newNode: Node = {
        id: `link-${linkId}`,
        type: "linkCard",
        position: { x: center.x - 90, y: center.y - 40 },
        data: {
          url,
          title,
          onDelete: (id: string) => {
            const parsed = parseNodeId(id);
            if (parsed) deleteLinkCard(today, parsed.id);
          },
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [getViewportCenter, today, addLinkCard, deleteLinkCard, setNodes, isReadOnly]
  );

  // Only render on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Redirect if no session
  useEffect(() => {
    if (isClient && (!currentSession || !currentSession.isActive)) {
      router.push("/");
    }
  }, [isClient, currentSession, router]);

  // Loading state
  if (!isClient) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No session state
  if (!currentSession || !currentSession.isActive) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-text-secondary">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-56px)]">
      {/* Read-only Banner */}
      <AnimatePresence>
        {isReadOnly && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="bg-amber-500/10 border-b border-amber-500/20 overflow-hidden"
          >
            <div className="px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Eye className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-500">
                    Viewing: {formatDateDisplay(viewingDate)}
                  </p>
                  <p className="text-xs text-amber-500/70">
                    Read-only mode - You can pan and zoom but cannot edit
                  </p>
                </div>
              </div>
              <button
                onClick={handleReturnToToday}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 text-sm font-medium rounded-lg transition-colors"
              >
                <span>Return to Today</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Bar - 48px */}
      <div className="h-12 bg-surface border-b border-border-subtle px-4 flex items-center justify-between flex-shrink-0">
        {/* Left: Back Link */}
        <Link
          href="/today"
          className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Today</span>
        </Link>

        {/* Center: Current viewing date */}
        <div className="flex items-center gap-2">
          {isReadOnly && (
            <Calendar className="w-4 h-4 text-amber-500" />
          )}
          <span className={cn(
            "text-sm font-semibold",
            isReadOnly ? "text-amber-500" : "text-text-primary"
          )}>
            {formatDateDisplay(viewingDate)}
          </span>
        </div>

        {/* Right: Archive Dropdown */}
        <ArchiveDropdown
          whiteboardDates={whiteboardDates}
          currentDate={viewingDate}
          onSelectDate={handleSelectDate}
        />
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={isReadOnly ? undefined : onEdgesChange}
          onConnect={isReadOnly ? undefined : onConnect}
          nodesDraggable={!isReadOnly}
          nodesConnectable={!isReadOnly}
          elementsSelectable={true}
          fitView
          minZoom={0.25}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
          className={cn("bg-void", isReadOnly && "cursor-grab")}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color={isReadOnly ? "#1A1A1A" : "#1A1A1A"}
          />
          <Controls
            className="!bg-surface !border-border-subtle !rounded-lg !shadow-lg"
            showInteractive={false}
          />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === "mission") {
                const data = node.data as { tagColor?: string };
                return data.tagColor || "#3B82F6";
              }
              if (node.type === "checkpoint") return "#F59E0B";
              if (node.type === "sticky" || node.type === "stickyNote") return "#FBBF24";
              if (node.type === "link" || node.type === "linkCard") return "#6B7280";
              return "#3B82F6";
            }}
            maskColor="rgba(10, 10, 10, 0.8)"
            className="!bg-surface !border-border-subtle !rounded-lg"
          />
        </ReactFlow>

        {/* Bottom Toolbar - Hidden in read-only mode */}
        {!isReadOnly && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-surface border border-border-subtle rounded-lg shadow-xl px-2 py-1.5">
            {/* Add Note Button */}
            <button
              onClick={handleAddNote}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <StickyNote className="w-4 h-4" />
              <span>Add Note</span>
            </button>

            {/* Divider */}
            <div className="w-px h-6 bg-border-subtle" />

            {/* Add Link Button */}
            <button
              onClick={() => setShowAddLinkModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
            >
              <Link2 className="w-4 h-4" />
              <span>Add Link</span>
            </button>
          </div>
        )}

        {/* Empty state - No whiteboard for this date */}
        {nodes.length === 0 && whiteboard === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              {isReadOnly ? (
                <>
                  <Calendar className="w-12 h-12 text-text-disabled mx-auto mb-4" />
                  <p className="text-text-secondary text-lg mb-2">
                    No whiteboard saved for this date
                  </p>
                  <p className="text-text-disabled text-sm mb-4">
                    {formatDateDisplay(viewingDate)}
                  </p>
                  <button
                    onClick={handleReturnToToday}
                    className="pointer-events-auto px-4 py-2 bg-surface hover:bg-surface-hover text-text-primary text-sm rounded-lg border border-border-subtle transition-colors"
                  >
                    Return to Today
                  </button>
                </>
              ) : (
                <>
                  <p className="text-text-secondary text-lg mb-2">No missions for today</p>
                  <p className="text-text-disabled text-sm">
                    Add missions in the Today View to see them here
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Link Modal */}
      <AddLinkModal
        isOpen={showAddLinkModal}
        onClose={() => setShowAddLinkModal(false)}
        onAdd={handleAddLink}
      />
    </div>
  );
}

// Main page component with ReactFlowProvider
export default function WhiteboardPage() {
  return (
    <ReactFlowProvider>
      <WhiteboardContent />
    </ReactFlowProvider>
  );
}
