import { useEffect, useState } from "react";
import BlackHoleCanvas from "./components/BlackHoleCanvas";
import Settings from "./components/Settings";
import Dashboard from "./components/Dashboard";
import StatsPanel from "./components/StatsPanel";
import Onboarding from "./components/Onboarding";
import PreviewCanvas from "./components/PreviewCanvas";
import AlertOverlay from "./components/AlertOverlay";
import { isFirstRun, getAlertLevel } from "./services/tauri-api";
import { useI18n } from "./i18n";

// DevTools toggle (only works in dev mode)
async function toggleDevtools() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("toggle_devtools");
  } catch {
    // Not in Tauri context
  }
}

type WindowRole = "main" | "blackhole" | "preview";
type MainPage = "dashboard" | "settings" | "stats";

export default function App() {
  const [windowRole, setWindowRole] = useState<WindowRole>("main");
  const [mainPage, setMainPage] = useState<MainPage>("dashboard");
  const [alertLevel, setAlertLevel] = useState<string>("green");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t } = useI18n();

  // Determine which Tauri window we're in
  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#settings") {
      setWindowRole("main");
    } else if (hash === "#blackhole") {
      setWindowRole("blackhole");
    } else {
      import("@tauri-apps/api/window")
        .then(({ getCurrentWindow }) => {
          const label = getCurrentWindow().label;
          if (label === "blackhole") {
            setWindowRole("blackhole");
          } else if (label === "preview") {
            setWindowRole("preview");
          } else {
            setWindowRole("main");
          }
        })
        .catch(() => {
          setWindowRole("main");
        });
    }
  }, []);

  // DevTools shortcut: Cmd/Ctrl + Shift + I
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "I") {
        e.preventDefault();
        toggleDevtools();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Check first run (main window only)
  useEffect(() => {
    if (windowRole !== "main") return;
    isFirstRun()
      .then((first) => {
        if (first) setShowOnboarding(true);
      })
      .catch(() => {});
  }, [windowRole]);

  // Poll alert level (blackhole/preview windows)
  useEffect(() => {
    if (windowRole === "main") return;

    const poll = setInterval(async () => {
      try {
        const level = await getAlertLevel();
        setAlertLevel(level);
      } catch {
        // dev mode
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [windowRole]);

  // Onboarding overlay (main window)
  if (windowRole === "main" && showOnboarding) {
    return <Onboarding />;
  }

  // Blackhole window — full screen overlay
  if (windowRole === "blackhole") {
    if (alertLevel === "blackhole") {
      return <BlackHoleCanvas />;
    }
    if (alertLevel === "green") return null;
    return (
      <>
        <AlertOverlay alertLevel={alertLevel} />
        <PreviewCanvas alertLevel={alertLevel} />
      </>
    );
  }

  // Preview window — small floating indicator
  if (windowRole === "preview") {
    if (alertLevel === "green") return null;
    return <PreviewCanvas alertLevel={alertLevel} />;
  }

  // ==================== Main Window ====================
  // Has bottom navigation: Dashboard | Settings | Stats
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
      }}
    >
      {/* Page content area */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {mainPage === "dashboard" && <Dashboard />}
        {mainPage === "settings" && <Settings />}
        {mainPage === "stats" && (
          <div style={{ padding: "28px 24px" }}>
            <h2
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#fff",
                marginBottom: 20,
              }}
            >
              📊 {t("stats_title")}
            </h2>
            <StatsPanel />
          </div>
        )}
      </div>

      {/* Bottom navigation bar */}
      <BottomNav currentPage={mainPage} onNavigate={setMainPage} />
    </div>
  );
}

// --- Bottom Navigation Component ---

function BottomNav({
  currentPage,
  onNavigate,
}: {
  currentPage: MainPage;
  onNavigate: (page: MainPage) => void;
}) {
  const { t } = useI18n();

  const tabs: { key: MainPage; icon: string; labelKey: "nav_dashboard" | "nav_settings" | "nav_stats" }[] = [
    { key: "dashboard", icon: "⏱️", labelKey: "nav_dashboard" },
    { key: "settings", icon: "⚙️", labelKey: "nav_settings" },
    { key: "stats", icon: "📊", labelKey: "nav_stats" },
  ];

  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #2a2a3e",
        background: "#16162a",
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentPage === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onNavigate(tab.key)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "10px 0 8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "20%",
                  right: "20%",
                  height: 2,
                  background: "#ff8c00",
                  borderRadius: "0 0 2 2",
                }}
              />
            )}
            <span
              style={{
                fontSize: 18,
                lineHeight: 1,
                marginBottom: 3,
                transition: "transform 0.2s",
                transform: isActive ? "scale(1.15)" : "scale(1)",
              }}
            >
              {tab.icon}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#ff8c00" : "#666",
                transition: "color 0.2s",
              }}
            >
              {t(tab.labelKey)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
