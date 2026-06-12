import { useRef, useEffect, useCallback } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { BlackHoleRenderer } from "../utils/blackhole-renderer";
import { getBlackholeProgress, dismissBlackhole } from "../services/tauri-api";

export default function BlackHoleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<BlackHoleRenderer | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const renderer = new BlackHoleRenderer({
      canvas,
      starCount: 200,
    });
    rendererRef.current = renderer;
    renderer.start();

    // 轮询黑洞进度
    const pollInterval = setInterval(async () => {
      try {
        const progress = await getBlackholeProgress();
        renderer.setProgress(progress);
      } catch {
        // dev mode: tauri not available, use local timer
      }
    }, 100);

    // 监听窗口大小变化
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderer.resize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener("resize", handleResize);
      renderer.stop();
    };
  }, []);

  const handleClick = useCallback(async () => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    renderer.collapse(async () => {
      try {
        await dismissBlackhole();
      } catch {
        // ignore
      }
      // 隐藏黑洞窗口
      try {
        await getCurrentWindow().hide();
      } catch {
        // ignore
      }
    });
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        cursor: "pointer",
      }}
    />
  );
}
