import { useState, useEffect, useCallback } from "react";
import {
  getSettings,
  updateSettings,
  type AppSettings,
  type WorkSchedule,
} from "../services/tauri-api";
import { useI18n } from "../i18n";
import type { LocaleKey } from "../i18n/locales/zh-CN";
import {
  Settings as SettingsIcon,
  SlidersHorizontal,
  Clock,
  Calendar,
  Globe,
  Zap,
  Coffee,
  Flame,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
} from "lucide-react";

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
    descKey: "preset_relaxed_desc",
    icon: "shield",
    interval: 60,
    duration: 60,
  },
  {
    nameKey: "preset_standard",
    descKey: "preset_standard_desc",
    icon: "zap",
    interval: 45,
    duration: 30,
  },
  {
    nameKey: "preset_strict",
    descKey: "preset_strict_desc",
    icon: "flame",
    interval: 15,
    duration: 15,
  },
];

const DAY_KEYS: LocaleKey[] = [
  "day_mon",
  "day_tue",
  "day_wed",
  "day_thu",
  "day_fri",
  "day_sat",
  "day_sun",
];

function presetNameKeyToRust(nameKey: LocaleKey): string {
  switch (nameKey) {
    case "preset_relaxed": return "relaxed";
    case "preset_standard": return "standard";
    case "preset_strict": return "strict";
    default: return "custom";
  }
}

function PresetIcon({ icon, size = 24, color }: { icon: string; size?: number; color?: string }) {
  switch (icon) {
    case "shield":
      return <ShieldCheck size={size} style={{ color }} />;
    case "zap":
      return <Zap size={size} style={{ color }} />;
    case "flame":
      return <Flame size={size} style={{ color }} />;
    default:
      return <Coffee size={size} style={{ color }} />;
  }
}

const PRESET_COLORS = ["#4caf50", "#ff8c00", "#ef5350"];

export default function Settings() {
  const { t, toggleLocale } = useI18n();
  const [settings, setSettings] = useState<AppSettings>({
    remind_interval_minutes: 45,
    fill_duration_seconds: 30,
  });
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedule, setSchedule] = useState<WorkSchedule>({
    enabled: false,
    work_start: "09:00",
    work_end: "18:00",
    enabled_days: [1, 2, 3, 4, 5],
  });
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => {
        setSettings(s);
        const match = PRESETS.find(
          (p) =>
            p.interval === s.remind_interval_minutes &&
            p.duration === s.fill_duration_seconds
        );
        if (match) {
          setActivePreset(match.nameKey);
        } else {
          setActivePreset(null);
          setShowCustom(true);
        }
        if (s.work_schedule) {
          setSchedule(s.work_schedule);
        }
      })
      .catch(() => {});
  }, []);

  const applySettings = useCallback(
    async (interval: number, duration: number, preset?: string) => {
      try {
        await updateSettings(interval, duration, preset);
      } catch {}
    },
    []
  );

  const handlePresetClick = useCallback(
    (preset: Preset) => {
      setActivePreset(preset.nameKey);
      setShowCustom(false);
      setSettings((prev) => ({
        ...prev,
        remind_interval_minutes: preset.interval,
        fill_duration_seconds: preset.duration,
      }));
      applySettings(preset.interval, preset.duration, presetNameKeyToRust(preset.nameKey));
    },
    [applySettings]
  );

  const handleIntervalChange = useCallback(
    (value: number) => {
      setActivePreset(null);
      setShowCustom(true);
      setSettings((prev) => ({ ...prev, remind_interval_minutes: value }));
      applySettings(value, settings.fill_duration_seconds, "custom");
    },
    [applySettings, settings.fill_duration_seconds]
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      setActivePreset(null);
      setShowCustom(true);
      setSettings((prev) => ({ ...prev, fill_duration_seconds: value }));
      applySettings(settings.remind_interval_minutes, value, "custom");
    },
    [applySettings, settings.remind_interval_minutes]
  );

  const toggleDay = (day: number) => {
    setSchedule((prev) => {
      const days = prev.enabled_days.includes(day)
        ? prev.enabled_days.filter((d) => d !== day)
        : [...prev.enabled_days, day].sort();
      return { ...prev, enabled_days: days };
    });
  };

  const handleReset = async () => {
    setShowResetConfirm(false);
    handlePresetClick(PRESETS[1]);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#0f0f1a",
        color: "#e0e0e0",
        fontFamily: '"SF Pro Display", system-ui, sans-serif',
        display: "flex",
        flexDirection: "column",
        padding: "24px 20px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* Title + Language */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <SettingsIcon size={22} style={{ color: "#ff8c00" }} />
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
            {t("settings_title")}
          </h1>
        </div>
        <button
          onClick={toggleLocale}
          style={{
            padding: "6px 12px",
            background: "#16162a",
            color: "#888",
            border: "1px solid #1e1e32",
            borderRadius: 8,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.2s",
          }}
        >
          <Globe size={12} /> {t("lang_switch")}
        </button>
      </div>

      {/* Preset Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 20 }}>
        {PRESETS.map((preset, idx) => {
          const isActive = activePreset === preset.nameKey;
          const accent = PRESET_COLORS[idx];
          return (
            <div
              key={preset.nameKey}
              onClick={() => handlePresetClick(preset)}
              style={{
                padding: "16px 8px",
                borderRadius: 14,
                border: `1.5px solid ${isActive ? accent : "#1e1e32"}`,
                background: isActive ? `${accent}12` : "#13132a",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.25s",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: accent,
                  }}
                />
              )}
              <div style={{ marginBottom: 6 }}>
                <PresetIcon icon={preset.icon} size={28} color={isActive ? accent : "#666"} />
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: isActive ? accent : "#bbb",
                  marginBottom: 3,
                }}
              >
                {t(preset.nameKey)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#666",
                  lineHeight: 1.4,
                }}
              >
                {t(preset.descKey)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom toggle */}
      <div
        onClick={() => setShowCustom(!showCustom)}
        style={{
          fontSize: 13,
          color: showCustom ? "#ff8c00" : "#666",
          cursor: "pointer",
          marginBottom: showCustom ? 16 : 20,
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 12px",
          background: showCustom ? "#ff8c0010" : "transparent",
          borderRadius: 8,
          border: showCustom ? "1px solid #ff8c0020" : "1px solid transparent",
          transition: "all 0.2s",
        }}
      >
        <SlidersHorizontal size={14} />
        <span style={{ flex: 1 }}>{t("custom_settings")}</span>
        <ChevronRight
          size={14}
          style={{
            transform: showCustom ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        />
      </div>

      {/* Custom sliders */}
      {showCustom && (
        <div
          style={{
            marginBottom: 20,
            padding: "16px",
            background: "#13132a",
            borderRadius: 14,
            border: "1px solid #1e1e32",
          }}
        >
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#999",
                marginBottom: 10,
              }}
            >
              <Clock size={14} /> {t("remind_interval")}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min={1}
                max={120}
                value={settings.remind_interval_minutes}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#ff8c00" }}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#ff8c00",
                  minWidth: 64,
                  textAlign: "right",
                  fontFamily: '"SF Mono", monospace',
                }}
              >
                {settings.remind_interval_minutes} {t("minutes")}
              </span>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                color: "#999",
                marginBottom: 10,
              }}
            >
              <Zap size={14} /> {t("fill_duration")}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min={10}
                max={300}
                value={settings.fill_duration_seconds}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#ff8c00" }}
              />
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#ff8c00",
                  minWidth: 64,
                  textAlign: "right",
                  fontFamily: '"SF Mono", monospace',
                }}
              >
                {settings.fill_duration_seconds} {t("seconds")}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Work Schedule */}
      <div style={{ marginBottom: 16 }}>
        <div
          onClick={() => setShowSchedule(!showSchedule)}
          style={{
            fontSize: 13,
            color: showSchedule ? "#ff8c00" : "#666",
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 12px",
            background: showSchedule ? "#ff8c0010" : "transparent",
            borderRadius: 8,
            border: showSchedule ? "1px solid #ff8c0020" : "1px solid transparent",
            transition: "all 0.2s",
          }}
        >
          <Calendar size={14} />
          <span style={{ flex: 1 }}>{t("work_schedule")}</span>
          <ChevronRight
            size={14}
            style={{
              transform: showSchedule ? "rotate(90deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </div>

        {showSchedule && (
          <div
            style={{
              marginTop: 10,
              padding: 16,
              background: "#13132a",
              borderRadius: 14,
              border: "1px solid #1e1e32",
            }}
          >
            {/* Enable toggle */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 14, color: "#bbb", display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={14} /> {t("enable_work_time")}
              </span>
              <div
                onClick={() =>
                  setSchedule((prev) => ({ ...prev, enabled: !prev.enabled }))
                }
                style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
              >
                {schedule.enabled ? (
                  <ToggleRight size={36} style={{ color: "#ff8c00" }} />
                ) : (
                  <ToggleLeft size={36} style={{ color: "#333" }} />
                )}
              </div>
            </div>

            {schedule.enabled && (
              <>
                <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}
                    >
                      {t("start_time")}
                    </label>
                    <input
                      type="time"
                      value={schedule.work_start}
                      onChange={(e) =>
                        setSchedule((prev) => ({ ...prev, work_start: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#0f0f1a",
                        color: "#e0e0e0",
                        border: "1px solid #1e1e32",
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{ fontSize: 12, color: "#666", display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}
                    >
                      {t("end_time")}
                    </label>
                    <input
                      type="time"
                      value={schedule.work_end}
                      onChange={(e) =>
                        setSchedule((prev) => ({ ...prev, work_end: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#0f0f1a",
                        color: "#e0e0e0",
                        border: "1px solid #1e1e32",
                        borderRadius: 8,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{ fontSize: 12, color: "#666", display: "block", marginBottom: 8 }}
                  >
                    {t("active_days")}
                  </label>
                  <div style={{ display: "flex", gap: 6 }}>
                    {DAY_KEYS.map((dayKey, i) => {
                      const day = i + 1;
                      const active = schedule.enabled_days.includes(day);
                      return (
                        <div
                          key={day}
                          onClick={() => toggleDay(day)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: active ? "#ff8c00" : "#0f0f1a",
                            border: `1.5px solid ${active ? "#ff8c00" : "#1e1e32"}`,
                            color: active ? "#fff" : "#444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s",
                          }}
                        >
                          {t(dayKey)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Reset */}
      <div style={{ paddingTop: 16, paddingBottom: 12 }}>
        {showResetConfirm ? (
          <div
            style={{
              padding: 14,
              background: "rgba(239,83,80,0.08)",
              borderRadius: 14,
              border: "1px solid rgba(239,83,80,0.2)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, color: "#ef5350", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <AlertCircle size={14} /> {t("reset_confirm")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: "#ef5350",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {t("confirm_reset")}
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: "#1e1e32",
                  color: "#bbb",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowResetConfirm(true)}
            style={{
              width: "100%",
              padding: "10px 0",
              background: "transparent",
              color: "#555",
              border: "1px solid #1e1e32",
              borderRadius: 10,
              fontSize: 13,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "all 0.2s",
            }}
          >
            <RotateCcw size={14} /> {t("reset_all")}
          </button>
        )}
      </div>
    </div>
  );
}

