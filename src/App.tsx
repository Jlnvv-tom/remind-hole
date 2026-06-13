import { useEffect, useState } from "react";
import BlackHoleCanvas from "./components/BlackHoleCanvas";
import Settings from "./components/Settings";
import Onboarding from "./components/Onboarding";
import PreviewCanvas from "./components/PreviewCanvas";
import AlertOverlay from "./components/AlertOverlay";
import {
  isFirstRun,
  getAlertLevel,
} from "./services/tauri-api";

function App() {
  const [page, setPage] = useState<"blackhole" | "settings" | "onboarding">("blackhole");
  const [alertLevel, setAlertLevel] = useState<string>("green");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Determine page by URL hash / window label
    const hash = window.location.hash;
    if (hash === "#settings") {
      setPage("settings");
    } else if (hash === "#blackhole") {
      setPage("blackhole");
    } else {
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const label = getCurrentWindow().label;
        if (label === "settings") {
          setPage("settings");
        } else if (label === "preview") {
          setPage("blackhole"); // preview window reuses blackhole page but smaller
        } else {
          setPage("blackhole");
        }
      }).catch(() => {
        setPage("blackhole");
      });
    }
  }, []);

  // Check first run (only for settings window)
  useEffect(() => {
    if (page !== "settings") return;
    isFirstRun()
      .then((first) => {
        if (first) setShowOnboarding(true);
      })
      .catch(() => {});
  }, [page]);

  // Poll alert level (only for blackhole window)
  useEffect(() => {
    if (page !== "blackhole") return;

    const poll = setInterval(async () => {
      try {
        const level = await getAlertLevel();
        setAlertLevel(level);
      } catch {
        // dev mode
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [page]);

  // Onboarding handles its own completion via completeOnboarding()
  // The parent re-checks isFirstRun on next render

  // Settings page
  if (page === "settings") {
    if (showOnboarding) {
      return <Onboarding />;
    }
    return <Settings />;
  }

  // Blackhole page - three-level alert system
  if (alertLevel === "blackhole") {
    // Full blackhole mode
    return <BlackHoleCanvas />;
  }

  if (alertLevel === "green") {
    // Silent mode - just a transparent window (no visible UI)
    return null;
  }

  // Yellow / Red alert mode
  return (
    <>
      <AlertOverlay alertLevel={alertLevel} />
      <PreviewCanvas alertLevel={alertLevel} />
    </>
  );
}

export default App;
