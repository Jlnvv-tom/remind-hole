import { useState, useEffect } from "react";
import { getSettings, updateSettings, type AppSettings } from "../services/tauri-api";

export default function Settings() {
  const [settings, setSettings] = useState<AppSettings>({
    remind_interval_minutes: 1, // 开发默认 1 分钟方便测试
    fill_duration_seconds: 30,
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setSettings(s))
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    try {
      await updateSettings(
        settings.remind_interval_minutes,
        settings.fill_duration_seconds
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    }
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
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 700,
          marginBottom: 32,
          color: "#fff",
        }}
      >
        🕳️ BlackHole 设置
      </h1>

      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            color: "#aaa",
            marginBottom: 8,
          }}
        >
          久坐提醒间隔
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range"
            min={1}
            max={120}
            value={settings.remind_interval_minutes}
            onChange={(e) =>
              setSettings({
                ...settings,
                remind_interval_minutes: Number(e.target.value),
              })
            }
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
            {settings.remind_interval_minutes} 分钟
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 28 }}>
        <label
          style={{
            display: "block",
            fontSize: 14,
            color: "#aaa",
            marginBottom: 8,
          }}
        >
          黑洞铺满时间
        </label>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="range"
            min={10}
            max={300}
            value={settings.fill_duration_seconds}
            onChange={(e) =>
              setSettings({
                ...settings,
                fill_duration_seconds: Number(e.target.value),
              })
            }
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
            {settings.fill_duration_seconds} 秒
          </span>
        </div>
      </div>

      <button
        onClick={handleSave}
        style={{
          marginTop: "auto",
          padding: "12px 0",
          background: saved ? "#4caf50" : "#ff8c00",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontSize: 16,
          fontWeight: 600,
          cursor: "pointer",
          transition: "background 0.3s",
        }}
      >
        {saved ? "✓ 已保存" : "保存设置"}
      </button>
    </div>
  );
}
