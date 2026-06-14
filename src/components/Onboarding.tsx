import { useRef, useEffect, useState, useCallback } from "react";
import Lottie from "lottie-react";
import { BlackHoleRenderer } from "../utils/blackhole-renderer";
import { completeOnboarding, updateSettings } from "../services/tauri-api";
import { useI18n } from "../i18n";
import type { LocaleKey } from "../i18n/locales/zh-CN";
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  Flame,
  Check,
} from "lucide-react";
import successCheck from "../../public/lottie/success-check.json";

interface Preset {
  nameKey: LocaleKey;
  descKey: LocaleKey;
  icon: "shield" | "zap" | "flame";
  interval: number;
  duration: number;
}

const PRESETS: Preset[] = [
  {
    nameKey: "preset_relaxed",
    descKey: "onboarding_relaxed_desc",
    icon: "shield",
    interval: 60,
    duration: 60,
  },
  {
    nameKey: "preset_standard",
    descKey: "onboarding_standard_desc",
    icon: "zap",
    interval: 45,
    duration: 30,
  },
  {
    nameKey: "preset_strict",
    descKey: "onboarding_strict_desc",
    icon: "flame",
    interval: 15,
    duration: 15,
  },
];

const PRESET_COLORS = ["#4caf50", "#ff8c00", "#ef5350"];

function PresetIcon({ icon, size = 28, color }: { icon: string; size?: number; color?: string }) {
  switch (icon) {
    case "shield": return <ShieldCheck size={size} style={{ color }} />;
    case "zap": return <Zap size={size} style={{ color }} />;
    case "flame": return <Flame size={size} style={{ color }} />;
    default: return <Zap size={size} style={{ color }} />;
  }
}

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
    const renderer = new BlackHoleRenderer({ canvas, starCount: 150 });
    rendererRef.current = renderer;
    renderer.start();
    let progress = 0;
    const demoInterval = setInterval(() => {
      progress += 0.005;
      if (progress >= 0.7) { progress = 0.7; clearInterval(demoInterval); }
      renderer.setProgress(progress);
    }, 30);
    return () => { clearInterval(demoInterval); renderer.stop(); };
  }, [step]);

  const handlePresetSelect = useCallback(
    async (preset: Preset) => {
      setSelectedPreset(preset.nameKey);
      try { await updateSettings(preset.interval, preset.duration); } catch {}
    },
    []
  );

  const handleComplete = useCallback(async () => {
    try { await completeOnboarding(); } catch {}
    setStep(3);
  }, []);

  if (step === 1) {
    return (
      <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0f0f1a" }}>
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.5 }}
        />
        <div
          style={{
            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            textAlign: "center", zIndex: 10,
          }}
        >
          <h1
            style={{
              fontSize: 30, fontWeight: 800, color: "#fff", marginBottom: 12,
              textShadow: "0 0 40px rgba(255,140,0,0.3)",
            }}
          >
            🕳️ {t("onboarding_title")}
          </h1>
          <p
            style={{
              fontSize: 15, color: "rgba(255,255,255,0.6)", maxWidth: 360,
              lineHeight: 1.7, marginBottom: 32, whiteSpace: "pre-line",
            }}
          >
            {t("onboarding_desc")}
          </p>
          <button
            onClick={() => setStep(2)}
            style={{
              padding: "12px 32px",
              background: "linear-gradient(135deg, #ff8c00, #e67600)",
              color: "#fff", border: "none", borderRadius: 12,
              fontSize: 15, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, margin: "0 auto",
              boxShadow: "0 4px 20px rgba(255,140,0,0.3)",
            }}
          >
            {t("next_step")} <ArrowRight size={16} />
          </button>
        </div>
      </div>
    );
  }

  if (step === 2) {
    return (
      <div
        style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
          background: "#0f0f1a", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          fontFamily: '"SF Pro Display", system-ui, sans-serif',
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginBottom: 6 }}>
          {t("choose_mode")}
        </h2>
        <p style={{ fontSize: 13, color: "#666", marginBottom: 28 }}>
          {t("can_change_later")}
        </p>

        <div style={{ display: "flex", gap: 14, marginBottom: 28 }}>
          {PRESETS.map((preset, idx) => {
            const isActive = selectedPreset === preset.nameKey;
            const accent = PRESET_COLORS[idx];
            return (
              <div
                key={preset.nameKey}
                onClick={() => handlePresetSelect(preset)}
                style={{
                  padding: "20px 16px", borderRadius: 16,
                  border: `1.5px solid ${isActive ? accent : "#1e1e32"}`,
                  background: isActive ? `${accent}12` : "#13132a",
                  cursor: "pointer", textAlign: "center", width: 110,
                  transition: "all 0.25s", position: "relative", overflow: "hidden",
                }}
              >
                {isActive && (
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: accent }} />
                )}
                <div style={{ marginBottom: 6 }}>
                  <PresetIcon icon={preset.icon} size={32} color={isActive ? accent : "#555"} />
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: isActive ? accent : "#bbb", marginBottom: 4 }}>
                  {t(preset.nameKey)}
                </div>
                <div style={{ fontSize: 10, color: "#666", lineHeight: 1.4 }}>
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
            background: selectedPreset
              ? "linear-gradient(135deg, #ff8c00, #e67600)"
              : "#1e1e32",
            color: selectedPreset ? "#fff" : "#444",
            border: "none", borderRadius: 12,
            fontSize: 16, fontWeight: 600, cursor: selectedPreset ? "pointer" : "not-allowed",
            display: "flex", alignItems: "center", gap: 8,
            boxShadow: selectedPreset ? "0 4px 20px rgba(255,140,0,0.3)" : "none",
            transition: "all 0.25s",
          }}
        >
          {selectedPreset && <Check size={16} />} {t("start_using")}
        </button>
      </div>
    );
  }

  // Step 3: Complete
  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
        background: "#0f0f1a", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        fontFamily: '"SF Pro Display", system-ui, sans-serif',
      }}
    >
      <Lottie animationData={successCheck} loop={false} style={{ width: 120, height: 120 }} />
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#fff", marginTop: 8, marginBottom: 8 }}>
        {t("all_set")}
      </h2>
      <p style={{ fontSize: 14, color: "#666", textAlign: "center", lineHeight: 1.7, whiteSpace: "pre-line" }}>
        {t("all_set_desc")}
      </p>
    </div>
  );
}
