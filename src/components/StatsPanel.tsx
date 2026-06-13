import { useState, useEffect } from "react";
import { getStats, type Stats } from "../services/tauri-api";
import { useI18n } from "../i18n";
import type { LocaleKey } from "../i18n/locales/zh-CN";

const DAY_KEYS: LocaleKey[] = [
  "day_mon",
  "day_tue",
  "day_wed",
  "day_thu",
  "day_fri",
  "day_sat",
  "day_sun",
];

export default function StatsPanel() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats>({
    today_standups: 0,
    streak_days: 0,
    weekly_data: [0, 0, 0, 0, 0, 0, 0],
    total_ignores: 0,
  });

  useEffect(() => {
    getStats()
      .then((s) => setStats(s))
      .catch(() => {});
  }, []);

  // Calculate this week vs last week
  const thisWeekAvg = stats.weekly_data.length > 0
    ? Math.round(stats.weekly_data.reduce((a, b) => a + b, 0) / stats.weekly_data.length)
    : 0;

  // Heatmap color logic
  const getHeatColor = (minutes: number): string => {
    if (minutes === 0) return "#2a2a3e"; // 无数据 - gray
    if (minutes <= 45) return "#2ea043"; // 按时起身 - green
    return "#da3633"; // 超时 - red
  };

  return (
    <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #2a2a3e" }}>
      <h3 style={{ fontSize: 14, color: "#888", marginBottom: 12, fontWeight: 600 }}>
        {t("stats_title")}
      </h3>

      <div
        style={{
          display: "flex",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ff8c00" }}>
            {stats.today_standups}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{t("today_standups")}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#4caf50" }}>
            {stats.streak_days}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{t("streak_days")}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#64b5f6" }}>
            {thisWeekAvg}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>{t("weekly_avg")}</div>
        </div>
      </div>

      {/* 7-day heatmap */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: "#666", marginBottom: 6 }}>{t("seven_day_record")}</div>
        <div style={{ display: "flex", gap: 4 }}>
          {stats.weekly_data.map((minutes, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 4,
                  backgroundColor: getHeatColor(minutes),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: minutes === 0 ? "#555" : "#fff",
                  fontWeight: 600,
                }}
              >
                {minutes > 0 ? `${minutes}'` : "—"}
              </div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 3 }}>
                {t(DAY_KEYS[i])}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 12, fontSize: 10, color: "#666" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#2ea043" }} />
          <span>{t("on_time")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#da3633" }} />
          <span>{t("overtime")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#2a2a3e" }} />
          <span>{t("no_data")}</span>
        </div>
      </div>
    </div>
  );
}
