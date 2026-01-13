"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
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
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, ChevronDown, Archive } from "lucide-react";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString, formatDateDisplay, cn } from "@/lib/utils";
import {
  MissionNode,
  CheckpointNode,
  StickyNode,
  LinkNode,
} from "@/components/whiteboard";

// Register custom node types
const nodeTypes = {
  mission: MissionNode,
  checkpoint: CheckpointNode,
  sticky: StickyNode,
  link: LinkNode,
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
  // Sticky note
  {
    id: "sticky-1",
    type: "sticky",
    position: { x: 700, y: 280 },
    data: {
      content: "Waiting for DevOps approval before deploying",
      color: "pink",
    },
  },
  // Link card
  {
    id: "link-1",
    type: "link",
    position: { x: 700, y: 430 },
    data: {
      title: "Deployment Checklist",
      url: "https://notion.so/deployment-checklist",
    },
  },
];

const initialEdges: Edge[] = [
  // Mission 1 to its checkpoints
  {
    id: "e-m1-cp1",
    source: "mission-1",
    sourceHandle: "checkpoint-out-left",
    target: "checkpoint-1-1",
    type: "smoothstep",
    style: { stroke: "#3B82F6", strokeWidth: 2 },
  },
  {
    id: "e-m1-cp2",
    source: "mission-1",
    sourceHandle: "checkpoint-out-right",
    target: "checkpoint-1-2",
    type: "smoothstep",
    style: { stroke: "#3B82F6", strokeWidth: 2 },
  },
  {
    id: "e-cp1-cp3",
    source: "checkpoint-1-1",
    target: "checkpoint-1-3",
    type: "smoothstep",
    style: { stroke: "#3B82F6", strokeWidth: 1.5 },
  },
  // Mission 1 to Mission 2 (flow)
  {
    id: "e-m1-m2",
    source: "mission-1",
    sourceHandle: "mission-out",
    target: "mission-2",
    type: "smoothstep",
    style: { stroke: "#6B7280", strokeWidth: 2, strokeDasharray: "5,5" },
  },
  // Mission 2 to Mission 3
  {
    id: "e-m2-m3",
    source: "mission-2",
    sourceHandle: "mission-out",
    target: "mission-3",
    type: "smoothstep",
    style: { stroke: "#6B7280", strokeWidth: 2, strokeDasharray: "5,5" },
  },
  // Mission 4 to sticky (reference)
  {
    id: "e-m4-sticky",
    source: "mission-4",
    sourceHandle: "mission-out",
    target: "sticky-1",
    type: "smoothstep",
    style: { stroke: "#EF4444", strokeWidth: 1.5 },
  },
];

export default function WhiteboardPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [showArchiveDropdown, setShowArchiveDropdown] = useState(false);
  const { currentSession, missions } = useMereoStore();

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
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
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
              if (node.type === "sticky") return "#FBBF24";
              if (node.type === "link") return "#6B7280";
              return "#3B82F6";
            }}
            maskColor="rgba(10, 10, 10, 0.8)"
            className="!bg-surface !border-border-subtle !rounded-lg"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
