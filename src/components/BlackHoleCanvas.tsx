import { useRef, useEffect, useCallback, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BlackHoleRenderer } from "../utils/blackhole-renderer";
import {
  getBlackholeProgress,
  dismissBlackhole,
  reportActivity,
  canDismiss,
  getCountdown,
  getCooldown,
} from "../services/tauri-api";
import { useI18n } from "../i18n";

export default function BlackHoleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);
  const [countdown, setCountdown] = useState<number>(-1);
  const [canClose, setCanClose] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const activityThrottleRef = useRef(0);
  const { t } = useI18n();

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = new BlackHoleRenderer({
      canvas,
      starCount: 200,
    });
    rendererRef.current = renderer;
    renderer.start();

    // Poll progress, countdown, can_dismiss, cooldown
    const pollInterval = setInterval(async () => {
      try {
        const [progress, cd, dismissable, cool] = await Promise.all([
          getBlackholeProgress(),
          getCountdown(),
          canDismiss(),
          getCooldown(),
        ]);
        renderer.setProgress(progress);
        setCountdown(cd);
        setCanClose(dismissable);
        setCooldown(cool);
      } catch {
        // Dev mode fallback: simulate
      }
    }, 200);

    // Resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Activity detection
    const handleActivity = () => {
      const now = Date.now();
      if (now - activityThrottleRef.current < 1000) return; // throttle 1s
      activityThrottleRef.current = now;
      reportActivity().catch(() => {});
    };

    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);
    window.addEventListener("mousedown", handleActivity);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
      window.removeEventListener("mousedown", handleActivity);
      renderer.stop();
    };
  }, []);

  const handleClick = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    try {
      const dismissable = await canDismiss();
      if (!dismissable) return;
    } catch {
      // Dev mode: allow dismiss
    }

    renderer.collapse(async () => {
      try {
        await dismissBlackhole();
      } catch {
        // ignore
      }
      try {
        await getCurrentWindow().hide();
      } catch {
        // ignore
      }
    });
  }, []);

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number): string => {
    if (seconds < 0) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const countdownText =
    countdown > 0
      ? formatCountdown(countdown)
      : countdown === 0
        ? t("devoured")
        : "";

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        cursor: canClose ? "pointer" : "not-allowed",
      }}
      onClick={handleClick}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Countdown overlay */}
      {countdownText && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: countdown === 0 ? 36 : 64,
              fontWeight: 800,
              color: "#fff",
              textShadow: "0 0 30px rgba(255, 140, 0, 0.6)",
              fontFamily: '"SF Pro Display", system-ui, sans-serif',
            }}
          >
            {countdownText}
          </div>
        </div>
      )}

      {/* Dismiss hint */}
      {canClose && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 16,
            color: "rgba(255, 255, 255, 0.7)",
            pointerEvents: "none",
            animation: "fadeInOut 2s ease-in-out infinite",
          }}
        >
          {t("click_to_close")}
        </div>
      )}

      {/* Cannot dismiss hint */}
      {!canClose && countdown > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 14,
            color: "rgba(255, 200, 100, 0.7)",
            pointerEvents: "none",
          }}
        >
          {t("leave_computer")}
        </div>
      )}

      {/* Cooldown indicator */}
      {cooldown > 0 && (
        <div
          style={{
            position: "absolute",
            top: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "8px 16px",
            background: "rgba(255, 140, 0, 0.2)",
            border: "1px solid rgba(255, 140, 0, 0.3)",
            borderRadius: 8,
            fontSize: 13,
            color: "#ff8c00",
            pointerEvents: "none",
          }}
        >
          {t("cooling_down", { seconds: Math.ceil(cooldown) })}
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
