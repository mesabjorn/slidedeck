import { useEffect, useState } from "react";
import type { CSSProperties } from "react";

type ShapeType = "hex" | "diamond" | "triangle" | "ring";

interface ShapeConfig {
  id: number;
  cycle: number;
  type: ShapeType;
  left: number;
  top: number;
  size: number;
  duration: number;
  angle: number;
  drift: number;
  spin: number;
  alpha: number;
}

interface TrailConfig {
  id: number;
  cycle: number;
  left: number;
  top: number;
  angle: number;
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  length: number;
  thickness: number;
}

const SHAPE_TYPES: ShapeType[] = ["hex", "ring", "diamond", "triangle"];

function randomShape(id: number, cycle = 0): ShapeConfig {
  const size = 34 + Math.random() * 1000;
  const sizeRatio = (size - 34) / 1000;
  const duration = 14 + sizeRatio * 26 + Math.random() * 5;
  const drift = 36 - sizeRatio * 24;
  const spinRange = 46 - sizeRatio * 34;

  return {
    id,
    cycle,
    type: SHAPE_TYPES[Math.floor(Math.random() * SHAPE_TYPES.length)],
    left: 6 + Math.random() * 88,
    top: 10 + Math.random() * 80,
    size,
    duration,
    angle: Math.random() * 360,
    drift,
    spin: -spinRange + Math.random() * spinRange * 2,
    alpha: 0.2 + Math.random() * 0.12,
  };
}

function shapeStyle(shape: ShapeConfig): CSSProperties {
  const radians = (shape.angle * Math.PI) / 180;
  const driftX = Math.cos(radians) * shape.drift;
  const driftY = Math.sin(radians) * shape.drift;
  const baseRotate = shape.type === "diamond" ? 45 : 0;
  return {
    "--x": `${shape.left}%`,
    "--y": `${shape.top}%`,
    "--size": `${shape.size}px`,
    "--duration": `${shape.duration}s`,
    "--shape-angle": `${shape.angle}deg`,
    "--shape-base-rotate": `${baseRotate}deg`,
    "--drift-x": `${driftX}px`,
    "--drift-y": `${driftY}px`,
    "--spin": `${shape.spin}deg`,
    "--shape-alpha": `${shape.alpha}`,
  } as CSSProperties;
}

function randomTrail(id: number, cycle = 0): TrailConfig {
  const angle = Math.random() * 360;
  const distance = 120 + Math.random() * 220;
  const radians = (angle * Math.PI) / 180;
  return {
    id,
    cycle,
    left: 8 + Math.random() * 84,
    top: 12 + Math.random() * 74,
    angle,
    driftX: Math.cos(radians) * distance,
    driftY: Math.sin(radians) * distance,
    duration: 3 + Math.random() * 1.3,
    delay: 1 + Math.random() * 3.2,
    length: 70 + Math.random() * 90,
    thickness: 1.2 + Math.random() * 1.2,
  };
}

function trailStyle(trail: TrailConfig): CSSProperties {
  return {
    "--trail-x": `${trail.left}%`,
    "--trail-y": `${trail.top}%`,
    "--trail-angle": `${trail.angle}deg`,
    "--trail-dx": `${trail.driftX}px`,
    "--trail-dy": `${trail.driftY}px`,
    "--trail-duration": `${trail.duration}s`,
    "--trail-delay": `${trail.delay}s`,
    "--trail-length": `${trail.length}px`,
    "--trail-thickness": `${trail.thickness}px`,
  } as CSSProperties;
}

export function SciFiBackdrop() {
  const [shapes, setShapes] = useState<ShapeConfig[]>(() =>
    Array.from({ length: 2 }, (_, i) => randomShape(i)),
  );
  const [trails, setTrails] = useState<TrailConfig[]>(() =>
    Array.from({ length: 1 }, (_, i) => randomTrail(i)),
  );

  useEffect(() => {
    let timeoutId = 0;

    const scheduleShapeRespawn = () => {
      timeoutId = window.setTimeout(
        () => {
          setShapes((current) => {
            const index = Math.floor(Math.random() * current.length);
            const next = [...current];
            const existing = next[index];
            next[index] = randomShape(existing.id, existing.cycle + 1);
            return next;
          });
          scheduleShapeRespawn();
        },
        10000 + Math.random() * 10000,
      );
    };

    scheduleShapeRespawn();
    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    let timeoutId = 0;

    const scheduleRespawn = () => {
      timeoutId = window.setTimeout(
        () => {
          setTrails((current) => {
            const index = Math.floor(Math.random() * current.length);
            const next = [...current];
            const existing = next[index];
            next[index] = randomTrail(existing.id, existing.cycle + 1);
            return next;
          });
          scheduleRespawn();
        },
        15000 + Math.random() * 10000,
      );
    };

    scheduleRespawn();
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <div className="scifi-backdrop" aria-hidden="true">
      <div className="scifi-haze" />
      <div className="scifi-grid" />
      {shapes.map((shape) => (
        <span
          key={`${shape.id}-${shape.cycle}`}
          style={shapeStyle(shape)}
          className={`scifi-shape scifi-shape--${shape.type}`}
        />
      ))}
      <div className="scifi-trails">
        {trails.map((trail) => (
          <span
            key={`${trail.id}-${trail.cycle}`}
            style={trailStyle(trail)}
            className="scifi-trail"
          />
        ))}
      </div>
    </div>
  );
}
