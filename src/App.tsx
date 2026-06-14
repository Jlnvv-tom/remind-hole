import { useEffect, useState } from "react";
import { Timer, Settings, BarChart3 } from "lucide-react";
import BlackHoleCanvas from "./components/BlackHoleCanvas";
import SettingsPage from "./components/Settings";
import Dashboard from "./components/Dashboard";
import StatsPanel from "./components/StatsPanel";
import Onboarding from "./components/Onboarding";
import PreviewCanvas from "./components/PreviewCanvas";
import AlertOverlay from "./components/AlertOverlay";
import { isFirstRun, getAlertLevel } from "./services/tauri-api";
import { useI18n } from "./i18n";

// DevTools toggle
async function toggleDevtools() {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("toggle_devtools");
  } catch {}
}

type WindowRole = "main" | "blackhole" | "preview";
type MainPage = "dashboard" | "settings" | "stats";

export default function App() {
  const [windowRole, setWindowRole] = useState<WindowRole>("main");
  const [mainPage, setMainPage] = useState<MainPage>("dashboard");
  const [alertLevel, setAlertLevel] = useState<string>("green");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { t } = useI18n();

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
          if (label === "blackhole") setWindowRole("blackhole");
          else if (label === "preview") setWindowRole("preview");
          else setWindowRole("main");
        })
        .catch(() => setWindowRole("main"));
    }
  }, []);

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

  useEffect(() => {
    if (windowRole !== "main") return;
    isFirstRun()
      .then((first) => { if (first) setShowOnboarding(true); })
      .catch(() => {});
  }, [windowRole]);

  useEffect(() => {
    if (windowRole === "main") return;
    const poll = setInterval(async () => {
      try { setAlertLevel(await getAlertLevel()); } catch {}
    }, 2000);
    return () => clearInterval(poll);
  }, [windowRole]);

  if (windowRole === "main" && showOnboarding) return <Onboarding />;

  if (windowRole === "blackhole") {
    if (alertLevel === "blackhole") return <BlackHoleCanvas />;
    if (alertLevel === "green") return null;
    return (
      <>
        <AlertOverlay alertLevel={alertLevel} />
        <PreviewCanvas alertLevel={alertLevel} />
      </>
    );
  }

  if (windowRole === "preview") {
    if (alertLevel === "green") return null;
    return <PreviewCanvas alertLevel={alertLevel} />;
  }

  // ==================== Main Window ====================
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
      }}
    >
      {/* Page content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {mainPage === "dashboard" && <Dashboard />}
        {mainPage === "settings" && <SettingsPage />}
        {mainPage === "stats" && (
          <div style={{ padding: "24px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <BarChart3 size={20} style={{ color: "#ff8c00" }} />
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#fff", margin: 0 }}>
                {t("stats_title")}
              </h2>
            </div>
            <StatsPanel />
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <BottomNav currentPage={mainPage} onNavigate={setMainPage} />
    </div>
  );
}

function BottomNav({
  currentPage,
  onNavigate,
}: {
  currentPage: MainPage;
  onNavigate: (page: MainPage) => void;
}) {
  const { t } = useI18n();

  const tabs: { key: MainPage; icon: typeof Timer; labelKey: "nav_dashboard" | "nav_settings" | "nav_stats" }[] = [
    { key: "dashboard", icon: Timer, labelKey: "nav_dashboard" },
    { key: "settings", icon: Settings, labelKey: "nav_settings" },
    { key: "stats", icon: BarChart3, labelKey: "nav_stats" },
  ];

  return (
    <div
      style={{
        display: "flex",
        borderTop: "1px solid #1e1e32",
        background: "#0d0d18",
        flexShrink: 0,
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
    >
      {tabs.map((tab) => {
        const isActive = currentPage === tab.key;
        const Icon = tab.icon;
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
              position: "relative",
              transition: "all 0.2s",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "25%",
                  right: "25%",
                  height: 2,
                  background: "#ff8c00",
                  borderRadius: "0 0 2px 2px",
                }}
              />
            )}
            <Icon
              size={20}
              style={{
                color: isActive ? "#ff8c00" : "#444",
                transition: "color 0.2s, transform 0.2s",
                transform: isActive ? "scale(1.1)" : "scale(1)",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#ff8c00" : "#555",
                marginTop: 3,
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
