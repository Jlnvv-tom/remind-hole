interface AlertOverlayProps {
  alertLevel: string;
}

export default function AlertOverlay({ alertLevel }: AlertOverlayProps) {
  if (alertLevel !== "yellow" && alertLevel !== "red") return null;

  const color =
    alertLevel === "red"
      ? "rgba(255, 0, 0, 0.08)"
      : "rgba(255, 200, 0, 0.05)";

  const glowColor =
    alertLevel === "red"
      ? "rgba(255, 0, 0, 0.15)"
      : "rgba(255, 200, 0, 0.1)";

  const animationName =
    alertLevel === "red" ? "alertPulseRed" : "alertPulseYellow";

  return (
    <>
      <style>{`
        @keyframes alertPulseYellow {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes alertPulseRed {
          0%, 100% { opacity: 0.5; }
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
    </>
  );
}
