"use client";

export function TacticalGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Grid Pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, #1A1A1A 1px, transparent 1px),
            linear-gradient(to bottom, #1A1A1A 1px, transparent 1px)
          `,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Optional: Center Crosshair/Reticle */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Horizontal line */}
        <div
          className="absolute w-24 h-px"
          style={{
            background: "linear-gradient(to right, transparent, #2A2A2A 20%, #2A2A2A 80%, transparent)",
          }}
        />
        {/* Vertical line */}
        <div
          className="absolute h-24 w-px"
          style={{
            background: "linear-gradient(to bottom, transparent, #2A2A2A 20%, #2A2A2A 80%, transparent)",
          }}
        />
        {/* Center dot */}
        <div className="absolute w-1 h-1 rounded-full bg-[#2A2A2A]" />
      </div>
    </div>
  );
}
