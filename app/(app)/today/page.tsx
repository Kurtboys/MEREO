"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString } from "@/lib/utils";

export default function TodayPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { currentSession, missions, tags, setMissionActive, completeMission } = useMereoStore();

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
      <div className="h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No session state
  if (!currentSession || !currentSession.isActive) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center">
        <p className="text-text-secondary">Redirecting to login...</p>
      </div>
    );
  }

  const today = getTodayDateString();
  const todayMissions = missions
    .filter((m) => m.scheduledDate === today)
    .sort((a, b) => a.order - b.order);

  const activeMission = todayMissions.find((m) => m.status === "active");

  return (
    <div className="h-[calc(100vh-56px)] flex">
      {/* Simple Sidebar */}
      <aside className="w-[280px] bg-surface border-r border-border-subtle p-4 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Today&apos;s Missions</h2>

        {todayMissions.length === 0 ? (
          <p className="text-text-secondary text-sm">No missions scheduled.</p>
        ) : (
          <div className="space-y-2">
            {todayMissions.map((mission) => {
              const tag = tags.find((t) => t.id === mission.tagId);
              return (
                <div
                  key={mission.id}
                  className={`p-3 rounded-lg border ${
                    mission.status === "active"
                      ? "border-accent bg-accent/10"
                      : mission.status === "completed"
                      ? "border-status-success/50 bg-status-success/10 opacity-60"
                      : "border-border-subtle bg-surface-hover"
                  }`}
                >
                  {tag && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full mb-1 inline-block"
                      style={{ backgroundColor: tag.color + "20", color: tag.color }}
                    >
                      {tag.name}
                    </span>
                  )}
                  <p className={`font-medium ${mission.status === "completed" ? "line-through" : ""}`}>
                    {mission.title}
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    {mission.totalEstimatedMinutes} min • {mission.checkpoints.length} checkpoints
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        {activeMission ? (
          <div className="text-center max-w-lg">
            <h1 className="text-3xl font-semibold mb-4">{activeMission.title}</h1>
            <p className="text-text-secondary mb-6">
              {activeMission.checkpoints.filter((c) => c.isComplete).length} / {activeMission.checkpoints.length} checkpoints
            </p>

            <div className="space-y-2 mb-8 text-left">
              {activeMission.checkpoints.map((cp) => (
                <div key={cp.id} className="flex items-center gap-3 p-2 bg-surface rounded">
                  <span className={cp.isComplete ? "text-status-success" : "text-text-disabled"}>
                    {cp.isComplete ? "✓" : "○"}
                  </span>
                  <span className={cp.isComplete ? "line-through text-text-disabled" : ""}>
                    {cp.title}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => completeMission(activeMission.id)}
              className="px-6 py-3 bg-accent text-void font-semibold rounded-lg hover:bg-accent-hover"
            >
              Complete Mission
            </button>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">
              {todayMissions.every((m) => m.status === "completed") && todayMissions.length > 0
                ? "All Done! 🎉"
                : "Ready to Start"}
            </h2>
            {todayMissions.some((m) => m.status === "scheduled") && (
              <button
                onClick={() => {
                  const first = todayMissions.find((m) => m.status === "scheduled");
                  if (first) setMissionActive(first.id);
                }}
                className="px-6 py-3 bg-accent text-void font-semibold rounded-lg hover:bg-accent-hover"
              >
                Start First Mission
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
