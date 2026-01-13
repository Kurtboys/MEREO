"use client";

import { useMereoStore, useTags, useMissionsByDate } from "@/lib/store";
import { getTodayDateString, formatTime, formatDuration } from "@/lib/utils";

export default function StoreTestPage() {
  const today = getTodayDateString();
  const tags = useTags();
  const todayMissions = useMissionsByDate(today);
  const { loadSeedData, clearAllData, currentSession } = useMereoStore();

  return (
    <div className="min-h-screen p-8 md:p-12">
      <header className="mb-12">
        <h1 className="text-4xl font-semibold mb-2">Store Test</h1>
        <p className="text-text-secondary">
          Testing Zustand store with seed data
        </p>
      </header>

      {/* Actions */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-text-secondary">
          Actions
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => loadSeedData()}
            className="px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-lg transition-colors"
          >
            Load Seed Data
          </button>
          <button
            onClick={() => clearAllData()}
            className="px-6 py-3 bg-status-bottleneck hover:opacity-90 text-void font-semibold rounded-lg transition-opacity"
          >
            Clear All Data
          </button>
        </div>
      </section>

      {/* Tags */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-text-secondary">
          Tags ({tags.length})
        </h2>
        {tags.length === 0 ? (
          <p className="text-text-disabled">
            No tags. Click "Load Seed Data" to populate.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <div
                key={tag.id}
                className="flex items-center gap-2 px-4 py-2 bg-surface rounded-lg"
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span>{tag.name}</span>
                <span className="text-text-disabled text-xs font-mono">
                  {tag.color}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Today's Missions */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-text-secondary">
          Today's Missions ({todayMissions.length}) - {today}
        </h2>
        {todayMissions.length === 0 ? (
          <p className="text-text-disabled">
            No missions for today. Click "Load Seed Data" to populate.
          </p>
        ) : (
          <div className="space-y-4">
            {todayMissions.map((mission) => {
              const tag = tags.find((t) => t.id === mission.tagId);
              return (
                <MissionCard key={mission.id} mission={mission} tag={tag} />
              );
            })}
          </div>
        )}
      </section>

      {/* Session Status */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-text-secondary">
          Session Status
        </h2>
        <div className="bg-surface rounded-lg p-6">
          {currentSession ? (
            <div className="space-y-2">
              <p>
                <span className="text-text-secondary">Date:</span>{" "}
                {currentSession.date}
              </p>
              <p>
                <span className="text-text-secondary">Active:</span>{" "}
                {currentSession.isActive ? "Yes" : "No"}
              </p>
              <p>
                <span className="text-text-secondary">Missions:</span>{" "}
                {currentSession.missionIds.length}
              </p>
            </div>
          ) : (
            <p className="text-text-disabled">No active session</p>
          )}
        </div>
      </section>

      {/* Store State Summary */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold mb-4 text-text-secondary">
          Store Summary
        </h2>
        <StoreStats />
      </section>
    </div>
  );
}

function MissionCard({
  mission,
  tag,
}: {
  mission: ReturnType<typeof useMissionsByDate>[0];
  tag?: { name: string; color: string };
}) {
  const { setMissionActive, completeMission, completeCheckpoint } =
    useMereoStore();

  const completedCheckpoints = mission.checkpoints.filter(
    (cp) => cp.isComplete
  ).length;
  const totalCheckpoints = mission.checkpoints.length;

  return (
    <div
      className="bg-surface rounded-lg p-5 border-l-4"
      style={{ borderColor: tag?.color || "#3B82F6" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {tag && (
              <span
                className="px-2 py-0.5 rounded text-xs font-medium"
                style={{
                  backgroundColor: tag.color + "20",
                  color: tag.color,
                }}
              >
                {tag.name}
              </span>
            )}
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                mission.status === "active"
                  ? "bg-accent/20 text-accent"
                  : mission.status === "completed"
                    ? "bg-status-success/20 text-status-success"
                    : mission.status === "bottleneck"
                      ? "bg-status-bottleneck/20 text-status-bottleneck"
                      : "bg-border-subtle text-text-secondary"
              }`}
            >
              {mission.status}
            </span>
          </div>
          <h3 className="text-lg font-semibold">{mission.title}</h3>
        </div>
        <div className="text-right text-sm text-text-secondary">
          <p>{formatTime(mission.totalEstimatedMinutes)}</p>
          <p>
            {completedCheckpoints}/{totalCheckpoints} done
          </p>
        </div>
      </div>

      {/* Checkpoints */}
      <div className="space-y-2 mb-4">
        {mission.checkpoints.map((cp) => (
          <div
            key={cp.id}
            className="flex items-center gap-3 text-sm"
            onClick={() => {
              if (!cp.isComplete) {
                completeCheckpoint(mission.id, cp.id);
              }
            }}
          >
            <input
              type="checkbox"
              checked={cp.isComplete}
              readOnly
              className="w-4 h-4 rounded border-border-subtle accent-accent cursor-pointer"
            />
            <span
              className={cp.isComplete ? "text-text-disabled line-through" : ""}
            >
              {cp.title}
            </span>
            <span className="text-text-disabled text-xs">
              ({formatTime(cp.estimatedMinutes)})
            </span>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {mission.status === "scheduled" && (
          <button
            onClick={() => setMissionActive(mission.id)}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-void text-sm font-medium rounded transition-colors"
          >
            Start Mission
          </button>
        )}
        {mission.status === "active" && (
          <button
            onClick={() => completeMission(mission.id)}
            className="px-4 py-2 bg-status-success hover:opacity-90 text-void text-sm font-medium rounded transition-opacity"
          >
            Complete Mission
          </button>
        )}
      </div>
    </div>
  );
}

function StoreStats() {
  const { tags, missions, whiteboards } = useMereoStore();

  const stats = [
    { label: "Tags", value: tags.length },
    { label: "Total Missions", value: missions.length },
    {
      label: "Scheduled",
      value: missions.filter((m) => m.status === "scheduled").length,
    },
    {
      label: "Active",
      value: missions.filter((m) => m.status === "active").length,
    },
    {
      label: "Completed",
      value: missions.filter((m) => m.status === "completed").length,
    },
    {
      label: "Bottleneck",
      value: missions.filter((m) => m.status === "bottleneck").length,
    },
    { label: "Whiteboards", value: Object.keys(whiteboards).length },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-surface rounded-lg p-4">
          <p className="text-2xl font-semibold font-mono">{stat.value}</p>
          <p className="text-sm text-text-secondary">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
