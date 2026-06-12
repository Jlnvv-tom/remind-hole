import { useEffect, useState } from "react";
import BlackHoleCanvas from "./components/BlackHoleCanvas";
import Settings from "./components/Settings";

function App() {
  const [page, setPage] = useState<"blackhole" | "settings">("blackhole");

  useEffect(() => {
    // 通过 URL hash 区分页面
    const hash = window.location.hash;
    if (hash === "#settings") {
      setPage("settings");
    } else if (hash === "#blackhole") {
      setPage("blackhole");
    } else {
      // 通过 Tauri 窗口 label 判断
      import("@tauri-apps/api/window").then(({ getCurrentWindow }) => {
        const label = getCurrentWindow().label;
        setPage(label === "settings" ? "settings" : "blackhole");
      }).catch(() => {
        setPage("blackhole");
      });
    }
  }, []);

  if (page === "settings") {
    return <Settings />;
  }

  return <BlackHoleCanvas />;
}

export default App;
