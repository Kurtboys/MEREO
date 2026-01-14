"use client";

interface CornerBracketProps {
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

function CornerBracket({ position }: CornerBracketProps) {
  const size = 24; // arm length in pixels
  const strokeWidth = 1;
  const color = "rgba(59, 130, 246, 0.3)"; // accent blue at 30% opacity

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
  };

  const rotations = {
    "top-left": "rotate-0",
    "top-right": "rotate-90",
    "bottom-left": "-rotate-90",
    "bottom-right": "rotate-180",
  };

  return (
    <div className={`absolute ${positionClasses[position]}`}>
      <svg
        width={size + strokeWidth}
        height={size + strokeWidth}
        viewBox={`0 0 ${size + strokeWidth} ${size + strokeWidth}`}
        className={rotations[position]}
        style={{ overflow: "visible" }}
      >
        {/* Vertical arm */}
        <line
          x1={strokeWidth / 2}
          y1={strokeWidth / 2}
          x2={strokeWidth / 2}
          y2={size}
          stroke={color}
          strokeWidth={strokeWidth}
        />
        {/* Horizontal arm */}
        <line
          x1={strokeWidth / 2}
          y1={strokeWidth / 2}
          x2={size}
          y2={strokeWidth / 2}
          stroke={color}
          strokeWidth={strokeWidth}
        />
      </svg>
    </div>
  );
}

export function HUDCornerBrackets() {
  return (
    <div className="absolute inset-8 pointer-events-none z-20">
      <CornerBracket position="top-left" />
      <CornerBracket position="top-right" />
      <CornerBracket position="bottom-left" />
      <CornerBracket position="bottom-right" />
    </div>
  );
}
