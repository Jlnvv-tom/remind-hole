import { useState, useEffect, useCallback } from "react";
import {
  getSettings,
  updateSettings,
  type AppSettings,
  type WorkSchedule,
} from "../services/tauri-api";
import StatsPanel from "./StatsPanel";
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
    descKey: "preset_relaxed_desc",
    emoji: "🧘",
    interval: 60,
    duration: 60,
  },
  {
    nameKey: "preset_standard",
    descKey: "preset_standard_desc",
    emoji: "⚡",
    interval: 30,
    duration: 30,
  },
  {
    nameKey: "preset_strict",
    descKey: "preset_strict_desc",
    emoji: "🔥",
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

export default function Settings() {
  const { t, toggleLocale } = useI18n();
  const [settings, setSettings] = useState<AppSettings>({
    remind_interval_minutes: 30,
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
        // Check if matches a preset
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
    async (interval: number, duration: number) => {
      try {
        await updateSettings(interval, duration);
      } catch {
        // ignore in dev mode
      }
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
      applySettings(preset.interval, preset.duration);
    },
    [applySettings]
  );

  const handleIntervalChange = useCallback(
    (value: number) => {
      setActivePreset(null);
      setShowCustom(true);
      setSettings((prev) => ({
        ...prev,
        remind_interval_minutes: value,
      }));
      applySettings(value, settings.fill_duration_seconds);
    },
    [applySettings, settings.fill_duration_seconds]
  );

  const handleDurationChange = useCallback(
    (value: number) => {
      setActivePreset(null);
      setShowCustom(true);
      setSettings((prev) => ({
        ...prev,
        fill_duration_seconds: value,
      }));
      applySettings(settings.remind_interval_minutes, value);
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
    // Reset to default preset
    handlePresetClick(PRESETS[1]);
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        background: "#1a1a2e",
        color: "#e0e0e0",
        fontFamily: '"SF Pro Display", system-ui, sans-serif',
        display: "flex",
        flexDirection: "column",
        padding: "32px 24px",
        boxSizing: "border-box",
        overflowY: "auto",
      }}
    >
      {/* Title + Language Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            color: "#fff",
            margin: 0,
          }}
        >
          {t("settings_title")}
        </h1>
        <button
          onClick={toggleLocale}
          style={{
            padding: "4px 12px",
            background: "#2a2a3e",
            color: "#aaa",
            border: "1px solid #3a3a4e",
            borderRadius: 6,
            fontSize: 12,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {t("lang_switch")}
        </button>
      </div>

      {/* Preset Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          marginBottom: 20,
        }}
      >
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.nameKey;
          return (
            <div
              key={preset.nameKey}
              onClick={() => handlePresetClick(preset)}
              style={{
                padding: "12px 6px",
                borderRadius: 10,
                border: `2px solid ${isActive ? "#ff8c00" : "#2a2a3e"}`,
                background: isActive
                  ? "rgba(255, 140, 0, 0.1)"
                  : "#1e1e32",
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 2 }}>{preset.emoji}</div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: isActive ? "#ff8c00" : "#ccc",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {t(preset.nameKey)}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "#888",
                  marginTop: 2,
                  lineHeight: 1.3,
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
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
          color: showCustom ? "#ff8c00" : "#888",
          cursor: "pointer",
          marginBottom: showCustom ? 16 : 20,
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showCustom ? "rotate(90deg)" : "rotate(0deg)" }}>
          ▸
        </span>
        {t("custom_settings")}
      </div>

      {/* Custom sliders */}
      {showCustom && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                color: "#aaa",
                marginBottom: 8,
              }}
            >
              {t("remind_interval")}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min={1}
                max={120}
                value={settings.remind_interval_minutes}
                onChange={(e) => handleIntervalChange(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#ff8c00",
                  minWidth: 60,
                  textAlign: "right",
                }}
              >
                {settings.remind_interval_minutes} {t("minutes")}
              </span>
            </div>
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: 14,
                color: "#aaa",
                marginBottom: 8,
              }}
            >
              {t("fill_duration")}
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input
                type="range"
                min={10}
                max={300}
                value={settings.fill_duration_seconds}
                onChange={(e) => handleDurationChange(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "#ff8c00",
                  minWidth: 60,
                  textAlign: "right",
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
            color: showSchedule ? "#ff8c00" : "#888",
            cursor: "pointer",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ transition: "transform 0.2s", display: "inline-block", transform: showSchedule ? "rotate(90deg)" : "rotate(0deg)" }}>
            ▸
          </span>
          {t("work_schedule")}
        </div>

        {showSchedule && (
          <div
            style={{
              marginTop: 12,
              padding: 16,
              background: "#1e1e32",
              borderRadius: 8,
            }}
          >
            {/* Enable switch */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span style={{ fontSize: 14, color: "#ccc" }}>{t("enable_work_time")}</span>
              <div
                onClick={() =>
                  setSchedule((prev) => ({
                    ...prev,
                    enabled: !prev.enabled,
                  }))
                }
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  background: schedule.enabled ? "#ff8c00" : "#3a3a4e",
                  cursor: "pointer",
                  position: "relative",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: "50%",
                    background: "#fff",
                    position: "absolute",
                    top: 2,
                    left: schedule.enabled ? 22 : 2,
                    transition: "left 0.2s",
                  }}
                />
              </div>
            </div>

            {schedule.enabled && (
              <>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>
                      {t("start_time")}
                    </label>
                    <input
                      type="time"
                      value={schedule.work_start}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          work_start: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#2a2a3e",
                        color: "#e0e0e0",
                        border: "1px solid #3a3a4e",
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 4 }}>
                      {t("end_time")}
                    </label>
                    <input
                      type="time"
                      value={schedule.work_end}
                      onChange={(e) =>
                        setSchedule((prev) => ({
                          ...prev,
                          work_end: e.target.value,
                        }))
                      }
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        background: "#2a2a3e",
                        color: "#e0e0e0",
                        border: "1px solid #3a3a4e",
                        borderRadius: 6,
                        fontSize: 14,
                        boxSizing: "border-box",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 12, color: "#888", display: "block", marginBottom: 6 }}>
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
                            background: active ? "#ff8c00" : "#2a2a3e",
                            color: active ? "#fff" : "#666",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
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

      {/* Stats Panel */}
      <StatsPanel />

      {/* Reset button */}
      <div style={{ marginTop: "auto", paddingTop: 20 }}>
        {showResetConfirm ? (
          <div
            style={{
              padding: 12,
              background: "rgba(255, 0, 0, 0.1)",
              borderRadius: 8,
              border: "1px solid rgba(255, 0, 0, 0.3)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 13, color: "#ff6666", marginBottom: 8 }}>
              {t("reset_confirm")}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleReset}
                style={{
                  flex: 1,
                  padding: "8px 0",
                  background: "#da3633",
                  color: "#fff",
                  border: "none",
                  borderRadius: 6,
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
                  background: "#2a2a3e",
                  color: "#ccc",
                  border: "none",
                  borderRadius: 6,
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
              color: "#666",
              border: "1px solid #2a2a3e",
              borderRadius: 8,
              fontSize: 13,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {t("reset_all")}
          </button>
        )}
      </div>
    </div>
  );
}
