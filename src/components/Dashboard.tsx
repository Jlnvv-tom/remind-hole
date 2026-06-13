import { useState, useEffect, useRef } from "react";
import { BlackHoleRenderer } from "../utils/blackhole-renderer";
import {
  getTimerStatus,
  startTimer,
  pauseTimer,
  resetTimer,
  type TimerStatus,
} from "../services/tauri-api";
import { useI18n } from "../i18n";

export default function Dashboard() {
  const { t } = useI18n();
  const [status, setStatus] = useState<TimerStatus | null>(null);
  const [starting, setStarting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);

  // Poll timer status every 500ms
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const s = await getTimerStatus();
        setStatus(s);
      } catch {
        // Dev mode fallback
      }
    }, 500);
    // Also fetch immediately
    getTimerStatus().then(setStatus).catch(() => {});
    return () => clearInterval(poll);
  }, []);

  // Mini black hole preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 160;
    canvas.height = 160;

    const renderer = new BlackHoleRenderer({
      canvas,
      starCount: 60,
    });
    rendererRef.current = renderer;
    renderer.start();

    return () => {
      renderer.stop();
    };
  }, []);

  // Sync progress to renderer
  useEffect(() => {
    if (rendererRef.current && status) {
      rendererRef.current.setProgress(status.progress);
    }
  }, [status]);

  const handleStart = async () => {
    setStarting(true);
    try {
      await startTimer();
    } catch {
      // ignore
    }
    setStarting(false);
  };

  const handlePause = async () => {
    try {
      await pauseTimer();
    } catch {
      // ignore
    }
  };

  const handleReset = async () => {
    try {
      await resetTimer();
    } catch {
      // ignore
    }
  };

  // Format elapsed seconds as HH:MM:SS or MM:SS
  const formatElapsed = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    }
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    if (m > 0) {
      return `${m}${t("dashboard_minute_short")} ${s}${t("dashboard_second_short")}`;
    }
    return `${s}${t("dashboard_second_short")}`;
  };

  // Alert level config
  const getAlertConfig = (level: string) => {
    switch (level) {
      case "green":
        return {
          color: "#4caf50",
          glow: "rgba(76, 175, 80, 0.15)",
          label: t("dashboard_alert_green"),
          statusText: t("dashboard_status_safe"),
        };
      case "yellow":
        return {
          color: "#ffc107",
          glow: "rgba(255, 193, 7, 0.15)",
          label: t("dashboard_alert_yellow"),
          statusText: t("dashboard_status_warning"),
        };
      case "red":
        return {
          color: "#f44336",
          glow: "rgba(244, 67, 54, 0.15)",
          label: t("dashboard_alert_red"),
          statusText: t("dashboard_status_danger"),
        };
      case "blackhole":
        return {
          color: "#9c27b0",
          glow: "rgba(156, 39, 176, 0.2)",
          label: t("dashboard_alert_blackhole"),
          statusText: t("dashboard_status_active"),
        };
      default:
        return {
          color: "#4caf50",
          glow: "rgba(76, 175, 80, 0.15)",
          label: t("dashboard_alert_green"),
          statusText: t("dashboard_status_safe"),
        };
    }
  };

  const alertLevel = status?.alert_level ?? "green";
  const alert = getAlertConfig(alertLevel);
  const elapsed = status?.elapsed ?? 0;
  const progress = status?.progress ?? 0;
  const secondsUntilFull = status?.seconds_until_full ?? 0;
  const isRunning = status?.running ?? false;
  const isUserStarted = status?.user_started ?? false;

  // Calculate progress percentage for the ring
  const ringProgress =
    alertLevel === "blackhole"
      ? progress
      : Math.min(elapsed / Math.max(secondsUntilFull + elapsed, 1), 1);

  // Determine timer phase for UI display
  const phase = !isUserStarted
    ? "idle" // Never started
    : !isRunning
      ? "paused" // Paused
      : alertLevel === "blackhole"
        ? "blackhole" // Black hole active
        : "running"; // Normal running

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "28px 20px 20px",
        boxSizing: "border-box",
        background: `radial-gradient(ellipse at center, ${alert.glow} 0%, transparent 70%)`,
        transition: "background 1s",
      }}
    >
      {/* Title */}
      <h2
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: "#aaa",
          margin: 0,
          marginBottom: 20,
          letterSpacing: 1,
        }}
      >
        {t("dashboard_title")}
      </h2>

      {/* Central countdown ring */}
      <div
        style={{
          position: "relative",
          width: 160,
          height: 160,
          marginBottom: 16,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 160,
            height: 160,
            opacity: phase === "idle" ? 0.15 : 0.5,
            borderRadius: "50%",
          }}
        />
        {/* SVG progress ring */}
        <svg
          width="160"
          height="160"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: "rotate(-90deg)",
          }}
        >
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke="#2a2a3e"
            strokeWidth="4"
          />
          <circle
            cx="80"
            cy="80"
            r="72"
            fill="none"
            stroke={phase === "idle" ? "#333" : alert.color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 72}`}
            strokeDashoffset={`${2 * Math.PI * 72 * (1 - (phase === "idle" ? 0 : ringProgress))}`}
            style={{
              transition: "stroke-dashoffset 0.5s, stroke 0.5s",
            }}
          />
        </svg>
        {/* Center text */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          {phase === "idle" ? (
            <>
              <div
                style={{
                  fontSize: 32,
                  lineHeight: 1,
                  marginBottom: 4,
                }}
              >
                🕳️
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#666",
                }}
              >
                {t("dashboard_no_activity")}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: phase === "paused" ? "#888" : alert.color,
                  fontFamily: '"SF Pro Display", system-ui, sans-serif',
                  transition: "color 0.5s",
                  lineHeight: 1,
                  textDecoration: phase === "paused" ? "line-through" : "none",
                  textDecorationColor: "#555",
                }}
              >
                {formatElapsed(elapsed)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#888",
                  marginTop: 4,
                }}
              >
                {phase === "paused"
                  ? "⏸"
                  : t("dashboard_elapsed")}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Alert badge — only show when timer is active */}
      {phase !== "idle" && (
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 16,
            background: `${alert.color}22`,
            border: `1px solid ${alert.color}44`,
            marginBottom: 16,
            transition: "all 0.5s",
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: alert.color,
              boxShadow: `0 0 6px ${alert.color}`,
              animation:
                alertLevel !== "green" || phase === "paused"
                  ? "pulse 1.5s ease-in-out infinite"
                  : "none",
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: alert.color,
            }}
          >
            {phase === "paused"
              ? "⏸ " + t("dashboard_paused")
              : alert.statusText}
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: 10,
          width: "100%",
          marginBottom: 16,
        }}
      >
        {phase === "idle" && (
          <button
            onClick={handleStart}
            disabled={starting}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "linear-gradient(135deg, #4caf50, #2e7d32)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: starting ? "wait" : "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
              boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.97)")
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            ▶ {t("dashboard_start")}
          </button>
        )}

        {phase === "running" && (
          <>
            <button
              onClick={handlePause}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "#2a2a3e",
                color: "#ffc107",
                border: "1px solid #ffc10744",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.15s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              ⏸ {t("dashboard_pause")}
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "#2a2a3e",
                color: "#ff8c00",
                border: "1px solid #ff8c0044",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.15s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              🧍 {t("dashboard_stand_up")}
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
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.15s",
                boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              ▶ {t("dashboard_resume")}
            </button>
            <button
              onClick={handleReset}
              style={{
                flex: 1,
                padding: "12px 0",
                background: "#2a2a3e",
                color: "#ff8c00",
                border: "1px solid #ff8c0044",
                borderRadius: 12,
                fontSize: 14,
                fontWeight: 600,
                cursor: "pointer",
                transition: "transform 0.15s",
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform = "scale(0.97)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              🧍 {t("dashboard_stand_up")}
            </button>
          </>
        )}

        {phase === "blackhole" && (
          <button
            onClick={handleReset}
            style={{
              flex: 1,
              padding: "12px 0",
              background: "linear-gradient(135deg, #9c27b0, #6a1b9a)",
              color: "#fff",
              border: "none",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.15s",
              boxShadow: "0 4px 15px rgba(156, 39, 176, 0.3)",
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.97)")
            }
            onMouseUp={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "scale(1)")
            }
          >
            🕳️ {t("dashboard_dismiss")}
          </button>
        )}
      </div>

      {/* Info cards — only when active */}
      {phase !== "idle" && (
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {/* Next reminder */}
          <div
            style={{
              padding: "12px 14px",
              background: "#1e1e32",
              borderRadius: 10,
              border: "1px solid #2a2a3e",
            }}
          >
            <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
              {t("dashboard_next_remind")}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#e0e0e0" }}>
              {alertLevel === "blackhole"
                ? "—"
                : formatCountdown(secondsUntilFull)}
            </div>
          </div>

          {/* Progress */}
          <div
            style={{
              padding: "12px 14px",
              background: "#1e1e32",
              borderRadius: 10,
              border: "1px solid #2a2a3e",
            }}
          >
            <div style={{ fontSize: 11, color: "#666", marginBottom: 4 }}>
              {t("dashboard_progress")}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: phase === "paused" ? "#888" : alert.color,
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
            marginTop: 16,
            height: 4,
            borderRadius: 2,
            background: "#2a2a3e",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${(alertLevel === "blackhole" ? progress : ringProgress) * 100}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${alert.color}, ${alert.color}88)`,
              borderRadius: 2,
              transition: "width 0.5s, background 0.5s",
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
