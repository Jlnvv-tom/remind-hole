import { useState, useEffect, useCallback, useRef } from "react";
import { useI18n } from "../i18n";

interface Planet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  collected: boolean;
}

interface EscapeGameProps {
  width: number;
  height: number;
  bhCx: number;
  bhCy: number;
  onSlowDown: () => void;
  onAllCollected: () => void;
}

const PLANET_COLORS = ["#4fc3f7", "#ab47bc", "#66bb6a", "#ffa726", "#ef5350"];

export default function EscapeGame({
  width,
  height,
  bhCx,
  bhCy,
  onSlowDown,
  onAllCollected,
}: EscapeGameProps) {
  const { t } = useI18n();
  const [planets, setPlanets] = useState<Planet[]>([]);
  const [bonusCooldown, setBonusCooldown] = useState(0);
  const animRef = useRef(0);
  const planetsRef = useRef<Planet[]>([]);

  // Initialize planets
  useEffect(() => {
    const initial: Planet[] = Array.from({ length: 3 }, (_, i) => {
      const angle = (Math.PI * 2 * i) / 3 + Math.random();
      const dist = 120 + Math.random() * 80;
      return {
        id: i,
        x: bhCx + Math.cos(angle) * dist,
        y: bhCy + Math.sin(angle) * dist,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        radius: 14 + Math.random() * 6,
        color: PLANET_COLORS[i % PLANET_COLORS.length],
        collected: false,
      };
    });
    setPlanets(initial);
    planetsRef.current = initial;
  }, [bhCx, bhCy]);

  // Animate planets
  useEffect(() => {
    const animate = () => {
      setPlanets((prev) => {
        const next = prev.map((p) => {
          if (p.collected) return p;

          let nx = p.x + p.vx;
          let ny = p.y + p.vy;

          // Bounce off edges
          if (nx < p.radius || nx > width - p.radius) {
            p.vx *= -1;
            nx = p.x + p.vx;
          }
          if (ny < p.radius || ny > height - p.radius) {
            p.vy *= -1;
            ny = p.y + p.vy;
          }

          return { ...p, x: nx, y: ny };
        });
        planetsRef.current = next;
        return next;
      });
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height]);

  // Bonus cooldown timer
  useEffect(() => {
    if (bonusCooldown <= 0) return;
    const timer = setTimeout(() => setBonusCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [bonusCooldown]);

  const handleClick = useCallback(
    (planetId: number) => {
      setPlanets((prev) => {
        const next = prev.map((p) =>
          p.id === planetId ? { ...p, collected: true } : p
        );
        const allCollected = next.every((p) => p.collected);
        if (allCollected) {
          setBonusCooldown(10);
          onAllCollected();
        } else {
          onSlowDown();
        }
        return next;
      });
    },
    [onSlowDown, onAllCollected]
  );

  const activePlanets = planets.filter((p) => !p.collected);

  return (
    <>
      {planets.map((planet) =>
        planet.collected ? null : (
          <div
            key={planet.id}
            onClick={(e) => {
              e.stopPropagation();
              handleClick(planet.id);
            }}
            style={{
              position: "absolute",
              left: planet.x - planet.radius,
              top: planet.y - planet.radius,
              width: planet.radius * 2,
              height: planet.radius * 2,
              borderRadius: "50%",
              background: `radial-gradient(circle at 35% 35%, ${planet.color}, ${planet.color}88)`,
              cursor: "pointer",
              zIndex: 20,
              boxShadow: `0 0 12px ${planet.color}66`,
              transition: "transform 0.1s",
            }}
            onMouseDown={(e) => e.stopPropagation()}
          />
        )
      )}

      {/* Game HUD */}
      {activePlanets.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 60,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "6px 14px",
            background: "rgba(0,0,0,0.5)",
            borderRadius: 16,
            fontSize: 12,
            color: "rgba(255,255,255,0.7)",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          {t("collect_planets", { collected: String(3 - activePlanets.length) })}
        </div>
      )}

      {/* Bonus indicator */}
      {bonusCooldown > 0 && (
        <div
          style={{
            position: "absolute",
            top: 90,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "4px 10px",
            background: "rgba(76, 175, 80, 0.3)",
            borderRadius: 12,
            fontSize: 11,
            color: "#4caf50",
            pointerEvents: "none",
            zIndex: 25,
          }}
        >
          {t("bonus_cooldown", { seconds: String(bonusCooldown) })}
        </div>
      )}
    </>
  );
}
