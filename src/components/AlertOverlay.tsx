import { AlertTriangle, AlertCircle } from "lucide-react";

interface AlertOverlayProps {
  alertLevel: string;
}

export default function AlertOverlay({ alertLevel }: AlertOverlayProps) {
  if (alertLevel !== "yellow" && alertLevel !== "red") return null;

  const isRed = alertLevel === "red";
  const color = isRed ? "rgba(239,83,80,0.06)" : "rgba(255,179,0,0.04)";
  const glowColor = isRed ? "rgba(239,83,80,0.12)" : "rgba(255,179,0,0.08)";
  const animationName = isRed ? "alertPulseRed" : "alertPulseYellow";

  return (
    <>
      <style>{`
        @keyframes alertPulseYellow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes alertPulseRed {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: "none",
          zIndex: 9998,
          boxShadow: `inset 0 0 120px 40px ${color}, inset 0 0 60px 20px ${glowColor}`,
          animation: `${animationName} 2s ease-in-out infinite`,
        }}
      />
      {/* Icon indicator */}
      <div
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 9999,
          pointerEvents: "none",
          animation: `${animationName} 2s ease-in-out infinite`,
        }}
      >
        {isRed ? (
          <AlertCircle size={28} style={{ color: "#ef5350" }} />
        ) : (
          <AlertTriangle size={28} style={{ color: "#ffb300" }} />
        )}
      </div>
    </>
  );
}
