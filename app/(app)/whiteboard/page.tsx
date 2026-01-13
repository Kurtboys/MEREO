"use client";

import { useEffect, useState, useCallback, useRef } from "react";
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
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, ChevronDown, Archive, StickyNote, Link2, Plus } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString, formatDateDisplay, cn, generateId } from "@/lib/utils";
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

// Sample hardcoded nodes for testing
// These use fallback data since store may not have matching missions
const initialNodes: Node[] = [
  // Mission 1 - Active with checkpoints
  {
    id: "mission-1",
    type: "mission",
    position: { x: 100, y: 50 },
    data: {
      missionId: "demo-mission-1",
      label: "Finish Q4 Report",
      status: "active",
      tagColor: "#3B82F6",
      tagName: "Work",
      totalMinutes: 90,
      checkpointCount: 3,
      completedCheckpoints: 1,
    },
  },
  // Checkpoints for Mission 1
  {
    id: "checkpoint-1-1",
    type: "checkpoint",
    position: { x: 20, y: 320 },
    data: {
      missionId: "demo-mission-1",
      checkpointId: "demo-cp-1",
      label: "Gather data from analytics",
      estimatedMinutes: 30,
      isComplete: true,
    },
  },
  {
    id: "checkpoint-1-2",
    type: "checkpoint",
    position: { x: 200, y: 320 },
    data: {
      missionId: "demo-mission-1",
      checkpointId: "demo-cp-2",
      label: "Draft executive summary",
      estimatedMinutes: 30,
      isComplete: false,
    },
  },
  {
    id: "checkpoint-1-3",
    type: "checkpoint",
    position: { x: 20, y: 430 },
    data: {
      missionId: "demo-mission-1",
      checkpointId: "demo-cp-3",
      label: "Review and finalize",
      estimatedMinutes: 30,
      isComplete: false,
    },
  },
  // Mission 2 - Scheduled/Locked
  {
    id: "mission-2",
    type: "mission",
    position: { x: 420, y: 50 },
    data: {
      missionId: "demo-mission-2",
      label: "Review Team Proposals",
      status: "scheduled",
      tagColor: "#10B981",
      tagName: "Management",
      totalMinutes: 45,
      checkpointCount: 2,
      completedCheckpoints: 0,
    },
  },
  // Mission 3 - Completed
  {
    id: "mission-3",
    type: "mission",
    position: { x: 420, y: 320 },
    data: {
      missionId: "demo-mission-3",
      label: "Morning standup call",
      status: "completed",
      tagColor: "#8B5CF6",
      tagName: "Meetings",
      totalMinutes: 15,
      checkpointCount: 1,
      completedCheckpoints: 1,
    },
  },
  // Mission 4 - Bottleneck
  {
    id: "mission-4",
    type: "mission",
    position: { x: 700, y: 50 },
    data: {
      missionId: "demo-mission-4",
      label: "Deploy to production",
      status: "bottleneck",
      tagColor: "#EF4444",
      tagName: "Dev",
      totalMinutes: 60,
      checkpointCount: 4,
      completedCheckpoints: 2,
    },
  },
  // Sticky note (using new StickyNoteNode)
  {
    id: "sticky-1",
    type: "stickyNote",
    position: { x: 700, y: 280 },
    data: {
      content: "Waiting for DevOps approval before deploying",
      color: "pink",
    },
    style: { width: 180, height: 150 },
  },
  // Link card (using new LinkCardNode)
  {
    id: "link-1",
    type: "linkCard",
    position: { x: 700, y: 480 },
    data: {
      title: "Deployment Checklist",
      url: "https://notion.so/deployment-checklist",
    },
  },
];

const initialEdges: Edge[] = [
  // Mission 1 to its checkpoints (using checkpoint edge type)
  {
    id: "e-m1-cp1",
    source: "mission-1",
    sourceHandle: "checkpoint-out-left",
    target: "checkpoint-1-1",
    type: "checkpoint",
    data: { isComplete: true, parentMissionActive: true },
  },
  {
    id: "e-m1-cp2",
    source: "mission-1",
    sourceHandle: "checkpoint-out-right",
    target: "checkpoint-1-2",
    type: "checkpoint",
    data: { isComplete: false, parentMissionActive: true },
  },
  {
    id: "e-cp1-cp3",
    source: "checkpoint-1-1",
    target: "checkpoint-1-3",
    type: "checkpoint",
    data: { isComplete: false, parentMissionActive: true },
  },
  // Mission 1 to Mission 2 (using mission edge type - active)
  {
    id: "e-m1-m2",
    source: "mission-1",
    sourceHandle: "mission-out",
    target: "mission-2",
    type: "mission",
    data: { sourceStatus: "active", targetStatus: "scheduled" },
  },
  // Mission 2 to Mission 3 (scheduled to completed)
  {
    id: "e-m2-m3",
    source: "mission-2",
    sourceHandle: "mission-out",
    target: "mission-3",
    type: "mission",
    data: { sourceStatus: "scheduled", targetStatus: "completed" },
  },
  // Mission 3 to Mission 4 (completed edge)
  {
    id: "e-m3-m4",
    source: "mission-3",
    sourceHandle: "mission-out",
    target: "mission-4",
    type: "mission",
    data: { sourceStatus: "completed", targetStatus: "bottleneck" },
  },
  // Mission 4 to sticky (reference - bottleneck)
  {
    id: "e-m4-sticky",
    source: "mission-4",
    sourceHandle: "mission-out",
    target: "sticky-1",
    type: "smoothstep",
    style: { stroke: "#EF4444", strokeWidth: 1.5 },
  },
];

// Inner component that uses useReactFlow
function WhiteboardContent() {
  const router = useRouter();
  const reactFlowInstance = useReactFlow();
  const [isClient, setIsClient] = useState(false);
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);
  const [showAddLinkModal, setShowAddLinkModal] = useState(false);
  const { currentSession } = useMereoStore();

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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
    const newNode: Node = {
      id: `sticky-${generateId()}`,
      type: "stickyNote",
      position: { x: center.x - 75, y: center.y - 75 },
      data: {
        content: "",
        color: "yellow",
      },
      style: { width: 150, height: 150 },
    };
    setNodes((nds) => [...nds, newNode]);
  }, [getViewportCenter, setNodes]);

  // Add a new link card
  const handleAddLink = useCallback(
    (url: string, title: string) => {
      const center = getViewportCenter();
      const newNode: Node = {
        id: `link-${generateId()}`,
        type: "linkCard",
        position: { x: center.x - 90, y: center.y - 40 },
        data: {
          url,
          title,
        },
      };
      setNodes((nds) => [...nds, newNode]);
    },
    [getViewportCenter, setNodes]
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

  const today = getTodayDateString();

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
          onNodesChange={onNodesChange}
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
