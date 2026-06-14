import { useState, useEffect } from "react";
import { getStats, type Stats } from "../services/tauri-api";
import { useI18n } from "../i18n";
import type { LocaleKey } from "../i18n/locales/zh-CN";
import {
  Flame,
  Star,
  TrendingUp,
  CalendarDays,
} from "lucide-react";

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
    today_stand_count: 0,
    streak_days: 0,
    weekly_sitting_minutes: [0, 0, 0, 0, 0, 0, 0],
    total_ignore_count: 0,
  });

  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    getStats()
      .then((s) => setStats(s))
      .catch(() => {});
    // Trigger entrance animation
    setTimeout(() => setAnimateIn(true), 50);
  }, []);

  const weeklyData = stats.weekly_sitting_minutes;
  const thisWeekAvg =
    weeklyData.length > 0
      ? Math.round(weeklyData.reduce((a, b) => a + b, 0) / weeklyData.length)
      : 0;

  // Max value for bar chart scaling
  const maxMinutes = Math.max(...weeklyData, 1);

  // Heatmap color
  const getHeatColor = (minutes: number): string => {
    if (minutes === 0) return "#1e1e32";
    if (minutes <= 45) return "#4caf50";
    if (minutes <= 90) return "#ffb300";
    return "#ef5350";
  };

  const getHeatGlow = (minutes: number): string => {
    if (minutes === 0) return "none";
    if (minutes <= 45) return "0 0 8px rgba(76,175,80,0.3)";
    if (minutes <= 90) return "0 0 8px rgba(255,179,0,0.3)";
    return "0 0 8px rgba(239,83,80,0.3)";
  };

  const statCards = [
    {
      icon: Flame,
      value: stats.today_stand_count,
      label: t("today_standups"),
      color: "#ff8c00",
      bg: "#ff8c0012",
    },
    {
      icon: Star,
      value: stats.streak_days,
      label: t("streak_days"),
      color: "#ffb300",
      bg: "#ffb30012",
    },
    {
      icon: TrendingUp,
      value: thisWeekAvg,
      label: t("weekly_avg"),
      color: "#64b5f6",
      bg: "#64b5f612",
    },
  ];

  return (
    <div
      style={{
        paddingTop: 0,
        opacity: animateIn ? 1 : 0,
        transform: animateIn ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.4s ease",
      }}
    >
      {/* Stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              padding: "14px 10px",
              background: card.bg,
              borderRadius: 14,
              border: `1px solid ${card.color}20`,
              textAlign: "center",
              transition: "transform 0.2s",
            }}
          >
            <card.icon size={18} style={{ color: card.color, marginBottom: 4 }} />
            <div
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: card.color,
                fontFamily: '"SF Mono", monospace',
                lineHeight: 1.1,
              }}
            >
              {card.value}
            </div>
            <div style={{ fontSize: 10, color: "#666", marginTop: 3 }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* 7-day bar chart */}
      <div
        style={{
          padding: "16px",
          background: "#13132a",
          borderRadius: 14,
          border: "1px solid #1e1e32",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            color: "#666",
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <CalendarDays size={12} /> {t("seven_day_record")}
        </div>

        {/* Bar chart */}
        <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 80 }}>
          {weeklyData.map((minutes, i) => {
            const height = minutes > 0 ? Math.max((minutes / maxMinutes) * 64, 8) : 4;
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    color: minutes > 0 ? "#aaa" : "#444",
                    fontFamily: '"SF Mono", monospace',
                  }}
                >
                  {minutes > 0 ? `${minutes}'` : ""}
                </span>
                <div
                  style={{
                    width: "100%",
                    height,
                    borderRadius: 4,
                    background: getHeatColor(minutes),
                    boxShadow: getHeatGlow(minutes),
                    transition: "height 0.5s ease",
                  }}
                />
                <span style={{ fontSize: 9, color: "#555" }}>{t(DAY_KEYS[i])}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          fontSize: 10,
          color: "#555",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "#4caf50",
            }}
          />
          <span>{t("on_time")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "#ffb300",
            }}
          />
          <span>{t("overtime")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: 2,
              background: "#ef5350",
            }}
          />
          <span>{t("overtime")}+</span>
        </div>
      </div>
    </div>
  );
}
