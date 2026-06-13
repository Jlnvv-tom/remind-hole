import { useRef, useEffect } from "react";

interface PreviewCanvasProps {
  alertLevel: string;
}

export default function PreviewCanvas({ alertLevel }: PreviewCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (alertLevel === "green") return;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    canvas.width = 100;
    canvas.height = 100;

    let animationId = 0;

    const render = (timestamp: number) => {
      ctx.clearRect(0, 0, 100, 100);

      const cx = 50;
      const cy = 50;

      let baseRadius: number;
      let pulseAmplitude: number;
      let pulseSpeed: number;
      let color: string;
      let glowColor: string;

      if (alertLevel === "yellow") {
        baseRadius = 10;
        pulseAmplitude = 3;
        pulseSpeed = 0.003;
        color = "#1a1a2e";
        glowColor = "rgba(255, 200, 0, 0.3)";
      } else {
        // red
        baseRadius = 17;
        pulseAmplitude = 5;
        pulseSpeed = 0.008;
        color = "#8b0000";
        glowColor = "rgba(255, 0, 0, 0.4)";
      }

      const pulse = Math.sin(timestamp * pulseSpeed) * pulseAmplitude;
      const radius = baseRadius + pulse;

      // Glow
      const glowGradient = ctx.createRadialGradient(cx, cy, radius, cx, cy, radius + 15);
      glowGradient.addColorStop(0, glowColor);
      glowGradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius + 15, 0, Math.PI * 2);
      ctx.fillStyle = glowGradient;
      ctx.fill();

      // Black hole
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      gradient.addColorStop(0, "#000000");
      gradient.addColorStop(0.7, "#000000");
      gradient.addColorStop(0.9, color);
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      // Tiny accretion ring
      if (alertLevel === "red") {
        ctx.beginPath();
        ctx.arc(cx, cy, radius + 2, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 50, 0, ${0.4 + Math.sin(timestamp * 0.005) * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationId);
  }, [alertLevel]);

  if (alertLevel === "green") return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        width: 100,
        height: 100,
        zIndex: 9999,
        pointerEvents: "none",
        opacity: 0.9,
      }}
    />
  );
}
