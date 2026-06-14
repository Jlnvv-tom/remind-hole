import { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  CircleDot,
  Gauge,
} from "lucide-react";
import { BlackHoleRenderer } from "../utils/blackhole-renderer";
import {
  getTimerStatus,
  startTimer,
  pauseTimer,
  resetTimer,
  type TimerStatus,
} from "../services/tauri-api";
import { useI18n } from "../i18n";
import pulseRing from "../../public/lottie/pulse-ring.json";
import timerBreathe from "../../public/lottie/timer-breathe.json";

export default function Dashboard() {
  const { t } = useI18n();
  const [status, setStatus] = useState<TimerStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const s = await getTimerStatus();
        setStatus(s);
      } catch {}
    }, 500);
    getTimerStatus().then(setStatus).catch(() => {});
    return () => clearInterval(poll);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = 160;
    canvas.height = 160;
    const renderer = new BlackHoleRenderer({ canvas, starCount: 60 });
    rendererRef.current = renderer;
    renderer.start();
    return () => renderer.stop();
  }, []);

  useEffect(() => {
    if (rendererRef.current && status) {
      rendererRef.current.setProgress(status.progress);
    }
  }, [status]);

  const handleStart = async () => {
    setStarting(true);
    try { await startTimer(); } catch {}
    setStarting(false);
  };
  const handlePause = async () => { try { await pauseTimer(); } catch {} };
  const handleReset = async () => { try { await resetTimer(); } catch {} };

  const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0)
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) return `${m}${t("dashboard_minute_short")} ${s}${t("dashboard_second_short")}`;
    return `${s}${t("dashboard_second_short")}`;
  };

  const alertLevel = status?.alert_level ?? "green";
  const elapsed = status?.elapsed ?? 0;
  const progress = status?.progress ?? 0;
  const secondsUntilFull = status?.seconds_until_full ?? 0;
  const isRunning = status?.running ?? false;
  const isUserStarted = status?.user_started ?? false;

  const ringProgress =
    alertLevel === "blackhole"
      ? progress
      : Math.min(elapsed / Math.max(secondsUntilFull + elapsed, 1), 1);

  const phase = !isUserStarted
    ? "idle"
    : !isRunning
      ? "paused"
      : alertLevel === "blackhole"
        ? "blackhole"
        : "running";

  const alertStyles: Record<string, { color: string; bg: string; Icon: React.FC<{ size?: number; style?: React.CSSProperties; fill?: string }> }> = {
    green:     { color: "#4caf50", bg: "rgba(76,175,80,0.06)",  Icon: CircleDot },
    yellow:    { color: "#ffb300", bg: "rgba(255,179,0,0.06)",  Icon: AlertTriangle },
    red:       { color: "#ef5350", bg: "rgba(239,83,80,0.06)",  Icon: AlertCircle },
    blackhole: { color: "#ab47bc", bg: "rgba(171,71,188,0.08)", Icon: Timer },
  };
  const { color, bg, Icon } = alertStyles[alertLevel] ?? alertStyles.green;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 20px 16px",
        boxSizing: "border-box",
        background: `radial-gradient(ellipse at 50% 40%, ${bg} 0%, #0f0f1a 70%)`,
        transition: "background 1s",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
        <Timer size={18} style={{ color: "#666" }} />
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "#777",
            margin: 0,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {t("dashboard_title")}
        </h2>
      </div>

      {/* Central ring */}
      <div style={{ position: "relative", width: 180, height: 180, marginBottom: 12 }}>
        {/* Lottie pulse ring */}
        <div
          style={{
            position: "absolute",
            top: -20,
            left: -20,
            width: 220,
            height: 220,
            opacity: phase === "idle" ? 0.12 : 0.35,
            pointerEvents: "none",
          }}
        >
          <Lottie animationData={pulseRing} loop style={{ width: 220, height: 220 }} />
        </div>

        {/* Canvas blackhole */}
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            width: 160,
            height: 160,
            opacity: phase === "idle" ? 0.08 : 0.4,
            borderRadius: "50%",
          }}
        />

        {/* SVG ring */}
        <svg
          width="180"
          height="180"
          style={{ position: "absolute", top: 0, left: 0, transform: "rotate(-90deg)" }}
        >
          <circle cx="90" cy="90" r="80" fill="none" stroke="#1a1a2e" strokeWidth="5" />
          <circle
            cx="90"
            cy="90"
            r="80"
            fill="none"
            stroke={phase === "idle" ? "#222" : color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 80}`}
            strokeDashoffset={`${2 * Math.PI * 80 * (1 - (phase === "idle" ? 0 : ringProgress))}`}
            style={{ transition: "stroke-dashoffset 0.5s ease, stroke 0.5s ease" }}
          />
        </svg>

        {/* Center content */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {phase === "idle" ? (
            <>
              <Lottie
                animationData={timerBreathe}
                loop
                style={{ width: 80, height: 80, opacity: 0.5 }}
              />
              <span style={{ fontSize: 11, color: "#444", marginTop: 0 }}>
                {t("dashboard_no_activity")}
              </span>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 36,
                  fontWeight: 800,
                  fontFamily: '"SF Mono", "JetBrains Mono", monospace',
                  color: phase === "paused" ? "#555" : color,
                  textDecoration: phase === "paused" ? "line-through" : "none",
                  textDecorationColor: "#444",
                  transition: "color 0.5s",
                  lineHeight: 1,
                }}
              >
                {formatElapsed(elapsed)}
              </div>
              <span style={{ fontSize: 10, color: "#555", marginTop: 4 }}>
                {phase === "paused" ? "⏸" : t("dashboard_elapsed")}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Alert badge */}
      {phase !== "idle" && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 14px",
            borderRadius: 20,
            background: `${color}12`,
            border: `1px solid ${color}28`,
            marginBottom: 16,
            transition: "all 0.5s",
          }}
        >
          <Icon
            size={14}
            style={{
              color,
              animation:
                alertLevel !== "green" ? "lucidePulse 1.5s ease-in-out infinite" : "none",
            }}
          />
          <span style={{ fontSize: 12, fontWeight: 600, color }}>
            {phase === "paused"
              ? `⏸ ${t("dashboard_paused")}`
              : alertLevel === "green"
                ? t("dashboard_status_safe")
                : alertLevel === "yellow"
                  ? t("dashboard_status_warning")
                  : alertLevel === "red"
                    ? t("dashboard_status_danger")
                    : t("dashboard_status_active")}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          width: "100%",
          maxWidth: 360,
          marginBottom: 16,
        }}
      >
        {phase === "idle" && (
          <button
            onClick={handleStart}
            disabled={starting}
            style={{
              flex: 1,
              padding: "14px 0",
              background: "linear-gradient(135deg, #4caf50, #2e7d32)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: starting ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 20px rgba(76,175,80,0.25)",
              transition: "transform 0.15s",
            }}
          >
            <Play size={18} fill="#fff" /> {t("dashboard_start")}
          </button>
        )}

        {phase === "running" && (
          <>
            <button
              onClick={handlePause}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "#16162a",
                color: "#ffb300",
                border: "1px solid #ffb30025",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "transform 0.15s",
              }}
            >
              <Pause size={16} /> {t("dashboard_pause")}
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "#16162a",
                color: "#ff8c00",
                border: "1px solid #ff8c0025",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                transition: "transform 0.15s",
              }}
            >
              <RotateCcw size={16} /> {t("dashboard_stand_up")}
            </button>
          </>
        )}

        {phase === "paused" && (
          <>
            <button
              onClick={handleStart}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 4px 20px rgba(76,175,80,0.25)",
              }}
            >
              <Play size={16} fill="#fff" /> {t("dashboard_resume")}
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "#16162a",
                color: "#ff8c00",
                border: "1px solid #ff8c0025",
                borderRadius: 14,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <RotateCcw size={16} /> {t("dashboard_stand_up")}
            </button>
          </>
        )}

        {phase === "blackhole" && (
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: "14px 0",
              background: "linear-gradient(135deg, #9c27b0, #6a1b9a)",
              color: "#fff",
              border: "none",
              borderRadius: 14,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              boxShadow: "0 4px 20px rgba(156,39,176,0.3)",
              transition: "transform 0.15s",
            }}
          >
            <Timer size={18} /> {t("dashboard_dismiss")}
          </button>
        )}
      </div>

      {/* Info cards */}
      {phase !== "idle" && (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              background: "#13132a",
              borderRadius: 14,
              border: "1px solid #1e1e32",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#555",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <TrendingUp size={12} /> {t("dashboard_next_remind")}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: "#e0e0e0",
                fontFamily: '"SF Mono", monospace',
              }}
            >
              {alertLevel === "blackhole" ? "—" : formatCountdown(secondsUntilFull)}
            </div>
          </div>
          <div
            style={{
              padding: "14px 16px",
              background: "#13132a",
              borderRadius: 14,
              border: "1px solid #1e1e32",
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: "#555",
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Gauge size={12} /> {t("dashboard_progress")}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: phase === "paused" ? "#666" : color,
                fontFamily: '"SF Mono", monospace',
              }}
            >
              {alertLevel === "blackhole"
                ? `${Math.round(progress * 100)}%`
                : `${Math.round(ringProgress * 100)}%`}
            </div>
          </div>
        </div>
      )}

      {/* Progress bar */}
      {phase !== "idle" && (
        <div
          style={{
            width: "100%",
            maxWidth: 360,
            marginTop: 14,
            height: 4,
            borderRadius: 2,
            background: "#1a1a2e",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(alertLevel === "blackhole" ? progress : ringProgress) * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${color}, ${color}66)`,
              borderRadius: 2,
              transition: "width 0.5s, background 0.5s",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes lucidePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}


