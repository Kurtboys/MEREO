"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMereoStore } from "@/lib/store";
import { MissionSidebar } from "@/components/MissionSidebar";
import { MissionFocus } from "@/components/MissionFocus";
import { TacticalGrid } from "@/components/TacticalGrid";
import { HUDCornerBrackets } from "@/components/HUDCornerBrackets";

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
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No session state
  if (!currentSession || !currentSession.isActive) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-text-secondary">Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Sidebar - 280px fixed */}
      <MissionSidebar />

      {/* Main Focus Area - The Ops Board */}
      <main className="flex-1 bg-void overflow-hidden relative">
        {/* Tactical Grid Background */}
        <TacticalGrid />

        {/* HUD Corner Brackets */}
        <HUDCornerBrackets />

        {/* Mission Focus Content */}
        <div className="relative z-10 h-full">
          <MissionFocus />
        </div>
      </main>
    </div>
  );
}
