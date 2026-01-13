"use client";

import { useRequireSession } from "@/lib/hooks";
import { MissionSidebar } from "@/components/MissionSidebar";
import { ActiveMissionFocus } from "@/components/ActiveMissionFocus";

export default function TodayPage() {
  const { isLoading, hasSession } = useRequireSession();

  // Show loading spinner while checking session
  if (isLoading || !hasSession) {
    return (
      <div className="h-[calc(100vh-56px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] flex">
      {/* Sidebar - 280px fixed */}
      <MissionSidebar />

      {/* Main Focus Area - fills remaining space */}
      <main className="flex-1 bg-void overflow-hidden">
        <ActiveMissionFocus />
      </main>
    </div>
  );
}
