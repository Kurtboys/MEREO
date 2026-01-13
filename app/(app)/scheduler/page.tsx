"use client";

import { useState } from "react";
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { useMereoStore, useTags } from "@/lib/store";
import { formatDateKey, cn } from "@/lib/utils";

export default function SchedulerPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const tags = useTags();
  const { missions, loadSeedData } = useMereoStore();

  // Get missions for selected date
  const selectedDateKey = formatDateKey(selectedDate);
  const missionsForDate = missions
    .filter((m) => m.scheduledDate === selectedDateKey)
    .sort((a, b) => a.order - b.order);

  // Get days in current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day of week for first day (for grid offset)
  const startDayOfWeek = monthStart.getDay();

  // Check if a date has missions
  const dateHasMissions = (date: Date) => {
    const dateKey = formatDateKey(date);
    return missions.some((m) => m.scheduledDate === dateKey);
  };

  const navigateMonth = (direction: number) => {
    setCurrentMonth((prev) => addDays(prev, direction * 30));
  };

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* Left Panel - Calendar */}
      <div className="w-80 border-r border-border-subtle p-6 flex flex-col">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <span className="text-text-secondary">&larr;</span>
          </button>
          <h2 className="text-lg font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-surface rounded-lg transition-colors"
          >
            <span className="text-text-secondary">&rarr;</span>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
            <div
              key={day}
              className="text-center text-xs text-text-disabled py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for offset */}
          {Array.from({ length: startDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Day cells */}
          {daysInMonth.map((day) => {
            const isSelected = isSameDay(day, selectedDate);
            const hasMissions = dateHasMissions(day);
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-colors relative",
                  isSelected
                    ? "bg-accent text-void"
                    : isTodayDate
                      ? "bg-surface-hover text-accent"
                      : "hover:bg-surface text-text-primary"
                )}
              >
                {format(day, "d")}
                {hasMissions && !isSelected && (
                  <span className="absolute bottom-1 w-1 h-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-6 space-y-2">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="w-full px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface rounded-lg transition-colors text-left"
          >
            Jump to Today
          </button>
        </div>

        {/* Tags Overview */}
        <div className="mt-auto pt-6 border-t border-border-subtle">
          <h3 className="text-sm font-medium text-text-secondary mb-3">Tags</h3>
          {tags.length === 0 ? (
            <p className="text-text-disabled text-sm">No tags created</p>
          ) : (
            <div className="space-y-2">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="text-text-secondary">{tag.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Panel - Mission List */}
      <div className="flex-1 p-8 overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1">
              {format(selectedDate, "EEEE, MMMM d")}
            </h1>
            <p className="text-text-secondary">
              {missionsForDate.length} mission{missionsForDate.length !== 1 ? "s" : ""} scheduled
            </p>
          </div>
          <button className="px-6 py-3 bg-accent hover:bg-accent-hover text-void font-semibold rounded-lg transition-colors">
            + New Mission
          </button>
        </div>

        {/* Placeholder Info */}
        <div className="bg-surface rounded-lg border border-border-subtle p-8 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-status-warning">
            Scheduler Coming in Chunk 5
          </h2>
          <p className="text-text-secondary mb-4">
            This is a placeholder for the full Scheduler View. It will include:
          </p>
          <ul className="text-text-secondary text-sm space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Mission creation with checkpoint builder
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Tag assignment and management
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Drag-to-reorder missions
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              Move missions between dates
            </li>
          </ul>
        </div>

        {/* Mission List */}
        {missionsForDate.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-text-disabled mb-4">No missions for this date</p>
            {missions.length === 0 && (
              <button
                onClick={() => loadSeedData()}
                className="px-4 py-2 text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Load sample missions
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {missionsForDate.map((mission) => {
              const tag = tags.find((t) => t.id === mission.tagId);
              return (
                <div
                  key={mission.id}
                  className="bg-surface rounded-lg p-5 border-l-4 hover:bg-surface-hover transition-colors"
                  style={{ borderColor: tag?.color || "#3B82F6" }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      {tag && (
                        <span
                          className="inline-block px-2 py-0.5 rounded text-xs font-medium mb-2"
                          style={{
                            backgroundColor: tag.color + "20",
                            color: tag.color,
                          }}
                        >
                          {tag.name}
                        </span>
                      )}
                      <h3 className="text-lg font-semibold">{mission.title}</h3>
                      <p className="text-text-secondary text-sm mt-1">
                        {mission.checkpoints.length} checkpoints |{" "}
                        {mission.totalEstimatedMinutes} min total
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors">
                        Edit
                      </button>
                      <button className="px-3 py-1.5 text-sm text-text-secondary hover:text-status-bottleneck transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Checkpoint Preview */}
                  <div className="mt-4 pt-4 border-t border-border-subtle">
                    <div className="space-y-2">
                      {mission.checkpoints.slice(0, 3).map((cp) => (
                        <div
                          key={cp.id}
                          className="flex items-center gap-3 text-sm text-text-secondary"
                        >
                          <span className="w-4 h-4 rounded border border-border-subtle flex items-center justify-center">
                            {cp.isComplete && (
                              <span className="w-2 h-2 rounded-sm bg-status-success" />
                            )}
                          </span>
                          <span className={cp.isComplete ? "line-through text-text-disabled" : ""}>
                            {cp.title}
                          </span>
                          <span className="text-text-disabled text-xs ml-auto">
                            {cp.estimatedMinutes}m
                          </span>
                        </div>
                      ))}
                      {mission.checkpoints.length > 3 && (
                        <p className="text-text-disabled text-xs">
                          +{mission.checkpoints.length - 3} more checkpoints
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
