"use client";

import { useRouter } from "next/navigation";
import { useMereoStore, useCurrentSession, useMissionsByDate } from "@/lib/store";
import { useRequireSession } from "@/lib/hooks";
import { getTodayDateString, formatTimeDisplay } from "@/lib/utils";

export default function TodayPage() {
  const router = useRouter();
  const { isLoading, hasSession } = useRequireSession();
  const today = getTodayDateString();
  const currentSession = useCurrentSession();
  const todayMissions = useMissionsByDate(today);
  const { endDaySession } = useMereoStore();

  // Show loading spinner while checking session
  if (isLoading || !hasSession) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleEndDay = () => {
    const brief = endDaySession();
    console.log("Executive Brief:", brief);
    router.push("/");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-semibold mb-1">Today View</h1>
          {currentSession && (
            <p className="text-text-secondary">
              Session started at {formatTimeDisplay(new Date(currentSession.startTime))} |
              Ends at {formatTimeDisplay(new Date(currentSession.endTime))}
            </p>
          )}
        </div>
        <button
          onClick={handleEndDay}
          className="px-6 py-3 bg-surface hover:bg-surface-hover border border-border-subtle rounded-lg transition-colors"
        >
          End Day
        </button>
      </header>

      {/* Placeholder Content */}
      <div className="max-w-2xl">
        <div className="bg-surface rounded-lg border border-border-subtle p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-status-warning">
            Today View Coming in Chunk 5
          </h2>
          <p className="text-text-secondary mb-4">
            This is a placeholder page. The full Today View with mission sidebar,
            timer, and checkpoint completion will be implemented in Chunk 5.
          </p>
          <p className="text-text-secondary">
            You have <span className="text-accent font-semibold">{todayMissions.length}</span> missions scheduled for today.
          </p>
        </div>

        {/* Quick Mission List */}
        <h3 className="text-lg font-semibold mb-4 text-text-secondary">Today's Missions</h3>
        <div className="space-y-3">
          {todayMissions.length === 0 ? (
            <p className="text-text-disabled">No missions scheduled for today.</p>
          ) : (
            todayMissions.map((mission) => (
              <div
                key={mission.id}
                className="bg-surface rounded-lg p-4 border-l-4"
                style={{ borderColor: mission.status === "active" ? "#3B82F6" : "#2A2A2A" }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className={`text-xs uppercase tracking-wide ${
                      mission.status === "active" ? "text-accent" : "text-text-disabled"
                    }`}>
                      {mission.status}
                    </span>
                    <h4 className="font-medium">{mission.title}</h4>
                  </div>
                  <span className="text-text-secondary text-sm">
                    {mission.checkpoints.filter(cp => cp.isComplete).length}/{mission.checkpoints.length} done
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
