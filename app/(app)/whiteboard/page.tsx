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
const initialNodes: Node[] = [
  {
    id: "mission-1",
    type: "mission",
    position: { x: 100, y: 100 },
    data: {
      label: "Finish Q4 Report",
      status: "in-progress",
      tagColor: "#3B82F6",
      timeEstimate: 45,
    },
  },
  {
    id: "mission-2",
    type: "mission",
    position: { x: 400, y: 100 },
    data: {
      label: "Review Team Proposals",
      status: "pending",
      tagColor: "#10B981",
      timeEstimate: 30,
    },
  },
  {
    id: "mission-3",
    type: "mission",
    position: { x: 250, y: 300 },
    data: {
      label: "Update Project Timeline",
      status: "completed",
      tagColor: "#3B82F6",
      timeEstimate: 20,
      timeActual: 18,
    },
  },
  {
    id: "checkpoint-1",
    type: "checkpoint",
    position: { x: 250, y: 450 },
    data: {
      label: "Morning Block Done",
      isComplete: false,
    },
  },
  {
    id: "sticky-1",
    type: "sticky",
    position: { x: 550, y: 280 },
    data: {
      content: "Remember to check Slack before the standup call!",
      color: "yellow",
    },
  },
  {
    id: "link-1",
    type: "link",
    position: { x: 100, y: 450 },
    data: {
      title: "Project Dashboard",
      url: "https://dashboard.example.com/project",
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: "e1-3",
    source: "mission-1",
    target: "mission-3",
    type: "smoothstep",
    style: { stroke: "#3B82F6", strokeWidth: 2 },
  },
  {
    id: "e2-3",
    source: "mission-2",
    target: "mission-3",
    type: "smoothstep",
    style: { stroke: "#10B981", strokeWidth: 2 },
  },
  {
    id: "e3-c1",
    source: "mission-3",
    target: "checkpoint-1",
    type: "smoothstep",
    style: { stroke: "#F59E0B", strokeWidth: 2 },
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
