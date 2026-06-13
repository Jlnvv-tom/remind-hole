import { useRef, useEffect, useState, useCallback } from "react";
import { BlackHoleRenderer } from "../utils/blackhole-renderer";
import { completeOnboarding, updateSettings } from "../services/tauri-api";
import { useI18n } from "../i18n";
import type { LocaleKey } from "../i18n/locales/zh-CN";

interface Preset {
  nameKey: LocaleKey;
  descKey: LocaleKey;
  emoji: string;
  interval: number;
  duration: number;
}

const PRESETS: Preset[] = [
  {
    nameKey: "preset_relaxed",
    descKey: "onboarding_relaxed_desc",
    emoji: "🧘",
    interval: 60,
    duration: 60,
  },
  {
    nameKey: "preset_standard",
    descKey: "onboarding_standard_desc",
    emoji: "⚡",
    interval: 30,
    duration: 30,
  },
  {
    nameKey: "preset_strict",
    descKey: "onboarding_strict_desc",
    emoji: "🔥",
    interval: 15,
    duration: 15,
  },
];

export default function Onboarding() {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);

  // Step 1: Demo animation
  useEffect(() => {
    if (step !== 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = new BlackHoleRenderer({
      canvas,
      starCount: 150,
    });
    rendererRef.current = renderer;
    renderer.start();

    // Fast demo: progress from 0 to ~0.7 over 3 seconds
    let progress = 0;
    const demoInterval = setInterval(() => {
      progress += 0.005;
      if (progress >= 0.7) {
        progress = 0.7;
        clearInterval(demoInterval);
      }
      renderer.setProgress(progress);
    }, 30);

    return () => {
      clearInterval(demoInterval);
      renderer.stop();
    };
  }, [step]);

  const handlePresetSelect = useCallback(
    async (preset: Preset) => {
      setSelectedPreset(preset.nameKey);
      try {
        await updateSettings(preset.interval, preset.duration);
      } catch {
        // ignore
      }
    },
    []
  );

  const handleComplete = useCallback(async () => {
    try {
      await completeOnboarding();
    } catch {
      // ignore
    }
    // The parent component will re-check isFirstRun and hide onboarding
    setStep(3);
  }, []);

  if (step === 1) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#1a1a2e",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            opacity: 0.6,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: "#fff",
              marginBottom: 12,
              textShadow: "0 0 30px rgba(255, 140, 0, 0.4)",
            }}
          >
            {t("onboarding_title")}
          </h1>
          <p
            style={{
              fontSize: 16,
              color: "rgba(255, 255, 255, 0.7)",
              maxWidth: 400,
              lineHeight: 1.6,
              marginBottom: 30,
              whiteSpace: "pre-line",
            }}
          >
            {t("onboarding_desc")}
          </p>
          <button
            onClick={() => setStep(2)}
            style={{
              padding: "12px 36px",
              background: "#ff8c00",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("next_step")}
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          background: "#1a1a2e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: '"SF Pro Display", system-ui, sans-serif',
        }}
      >
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          {t("choose_mode")}
        </h2>
        <p style={{ fontSize: 14, color: "#888", marginBottom: 30 }}>
          {t("can_change_later")}
        </p>

        <div style={{ display: "flex", gap: 14, marginBottom: 30 }}>
          {PRESETS.map((preset) => {
            const isActive = selectedPreset === preset.nameKey;
            return (
              <div
                key={preset.nameKey}
                onClick={() => handlePresetSelect(preset)}
                style={{
                  padding: "20px 16px",
                  borderRadius: 12,
                  border: `2px solid ${isActive ? "#ff8c00" : "#2a2a3e"}`,
                  background: isActive
                    ? "rgba(255, 140, 0, 0.1)"
                    : "#1e1e32",
                  cursor: "pointer",
                  textAlign: "center",
                  width: 120,
                  transition: "all 0.2s",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 6 }}>
                  {preset.emoji}
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: isActive ? "#ff8c00" : "#ccc",
                    marginBottom: 4,
                  }}
                >
                  {t(preset.nameKey)}
                </div>
                <div style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>
                  {t(preset.descKey)}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleComplete}
          disabled={!selectedPreset}
          style={{
            padding: "12px 48px",
            background: selectedPreset ? "#ff8c00" : "#2a2a3e",
            color: selectedPreset ? "#fff" : "#555",
            border: "none",
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: selectedPreset ? "pointer" : "not-allowed",
            transition: "all 0.2s",
          }}
        >
          {t("start_using")}
        </button>
      </div>
    );
  }

  // Step 3: Complete
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: '"SF Pro Display", system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
      <h2
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 8,
        }}
      >
        {t("all_set")}
      </h2>
      <p style={{ fontSize: 14, color: "#888", textAlign: "center", lineHeight: 1.6, whiteSpace: "pre-line" }}>
        {t("all_set_desc")}
      </p>
    </div>
  );
}
