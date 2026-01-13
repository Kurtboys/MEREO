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
import { ArrowLeft, ChevronDown, Archive, StickyNote, Link2 } from "lucide-react";
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
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);

  // Store state
  const {
    currentSession,
    missions,
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

  const today = getTodayDateString();
  const todayMissions = useMemo(() => getMissionsByDate(today), [getMissionsByDate, today]);
  const whiteboard = whiteboards[today] || null;

  // Generate initial layout from store data
  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => {
    if (!isClient) return { nodes: [], edges: [] };
    return generateWhiteboardLayout(todayMissions, tags, whiteboard);
  }, [isClient, todayMissions, tags, whiteboard]);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when missions or whiteboard changes
  useEffect(() => {
    if (isClient && todayMissions.length > 0) {
      const { nodes: newNodes, edges: newEdges } = generateWhiteboardLayout(
        todayMissions,
        tags,
        whiteboard
      );
      setNodes(newNodes);
      setEdges(newEdges);
    }
  }, [isClient, todayMissions, tags, whiteboard, setNodes, setEdges]);

  // Initialize whiteboard if it doesn't exist
  useEffect(() => {
    if (isClient && currentSession && !whiteboard && todayMissions.length > 0) {
      initializeWhiteboard(today, todayMissions);
    }
  }, [isClient, currentSession, whiteboard, todayMissions, today, initializeWhiteboard]);

  // Debounced position save
  const saveNodePosition = useDebouncedCallback(
    useCallback(
      (nodeId: string, nodeType: "mission" | "checkpoint", position: { x: number; y: number }) => {
        updateNodePosition(today, nodeId, nodeType, position);
      },
      [today, updateNodePosition]
    ),
    300
  );

  // Handle node changes with position tracking
  const handleNodesChange = useCallback(
    (changes: NodeChange<Node>[]) => {
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
    [onNodesChange, saveNodePosition]
  );

  // Handle edge connections
  const onConnect = useCallback(
    (connection: Connection) => {
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
    [setEdges]
  );

  // Get viewport center for adding new nodes
  const getViewportCenter = useCallback(() => {
    const { x, y, zoom } = reactFlowInstance.getViewport();
    const centerX = (-x + window.innerWidth / 2) / zoom;
    const centerY = (-y + window.innerHeight / 2) / zoom;
    return { x: centerX, y: centerY };
  }, [reactFlowInstance]);

  // Add a new sticky note
  const handleAddNote = useCallback(() => {
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
  }, [getViewportCenter, today, addStickyNote, deleteStickyNote, updateStickyNote, setNodes]);

  // Add a new link card
  const handleAddLink = useCallback(
    (url: string, title: string) => {
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
    [getViewportCenter, today, addLinkCard, deleteLinkCard, setNodes]
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-archive-dropdown]")) {
        setShowArchiveDropdown(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

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

        {/* Center: Date */}
        <span className="text-sm font-semibold text-text-primary">
          {formatDateDisplay(today)}
        </span>

        {/* Right: Archive Dropdown */}
        <div className="relative" data-archive-dropdown>
          <button
            onClick={() => setShowArchiveDropdown(!showArchiveDropdown)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors",
              showArchiveDropdown
                ? "bg-surface-hover text-text-primary"
                : "text-text-secondary hover:text-text-primary hover:bg-surface-hover"
            )}
          >
            <Archive className="w-4 h-4" />
            <span>Archive</span>
            <ChevronDown
              className={cn(
                "w-3 h-3 transition-transform",
                showArchiveDropdown && "rotate-180"
              )}
            />
          </button>

          {/* Dropdown placeholder */}
          {showArchiveDropdown && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border-subtle rounded-lg shadow-lg z-50 p-4">
              <p className="text-sm text-text-secondary">
                Archive functionality coming soon.
              </p>
              <p className="text-xs text-text-disabled mt-2">
                Save whiteboard layouts for future reference.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* React Flow Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={handleNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          minZoom={0.25}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
          className="bg-void"
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1}
            color="#1A1A1A"
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

        {/* Bottom Toolbar */}
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

        {/* Empty state */}
        {nodes.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-text-secondary text-lg mb-2">No missions for today</p>
              <p className="text-text-disabled text-sm">
                Add missions in the Today View to see them here
              </p>
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
