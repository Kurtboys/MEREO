"use client";

import { useCurrentSession, useMissionsByDate } from "@/lib/store";
import { useRequireSession } from "@/lib/hooks";
import { getTodayDateString, formatDateDisplay } from "@/lib/utils";

export default function WhiteboardPage() {
  const { isLoading, hasSession } = useRequireSession();
  const today = getTodayDateString();
  const currentSession = useCurrentSession();
  const todayMissions = useMissionsByDate(today);

  // Show loading spinner while checking session
  if (isLoading || !hasSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Whiteboard Toolbar */}
      <div className="h-12 bg-surface border-b border-border-subtle px-4 flex items-center justify-between">
        <span className="text-sm text-text-secondary">
          {formatDateDisplay(today)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-disabled">
            Zoom: 100%
          </span>
        </div>
      </div>

      {/* Canvas Area Placeholder */}
      <div className="flex-1 relative overflow-hidden">
        {/* Dot Grid Background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, #1A1A1A 1px, transparent 1px)`,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Placeholder Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-surface rounded-lg border border-border-subtle p-8 max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4 text-status-warning">
              Whiteboard Coming in Chunk 6-7
            </h2>
            <p className="text-text-secondary mb-4">
              This is a placeholder for the infinite canvas whiteboard with React Flow.
              It will include:
            </p>
            <ul className="text-text-secondary text-sm text-left space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Mission and checkpoint nodes
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Bezier curve connections
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Sticky notes and link cards
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Pan, zoom, and minimap
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                Completion animations
              </li>
            </ul>
            <p className="text-text-disabled text-sm mt-6">
              {todayMissions.length} missions ready for whiteboard layout
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="h-12 bg-surface border-t border-border-subtle px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            -
          </button>
          <span className="text-sm text-text-secondary">100%</span>
          <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            +
          </button>
          <span className="w-px h-4 bg-border-subtle" />
          <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            Fit View
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            Add Note
          </button>
          <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
            Add Link
          </button>
        </div>
      </div>
    </div>
  );
}
