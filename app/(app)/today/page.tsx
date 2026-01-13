"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMereoStore } from "@/lib/store";
import { getTodayDateString } from "@/lib/utils";
import { MissionSidebar } from "@/components/MissionSidebar";
import { ActiveMissionFocus } from "@/components/ActiveMissionFocus";

export default function TodayPage() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { currentSession } = useMereoStore();

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
