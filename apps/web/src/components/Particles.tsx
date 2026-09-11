import { useMemo } from "react";

interface Fleck {
  left: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
}

/** Pequeñas partículas doradas que flotan hacia arriba en el hero — un guiño sutil a los recortes de cabello / brillo ambiente. */
export function Particles({ count = 16, className = "" }: { count?: number; className?: string }) {
  const flecks = useMemo<Fleck[]>(
    () =>
      Array.from({ length: count }).map(() => ({
        left: Math.random() * 100,
        size: 2 + Math.random() * 4,
        duration: 9 + Math.random() * 10,
        delay: Math.random() * 12,
        drift: (Math.random() - 0.5) * 60,
      })),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      {flecks.map((f, i) => (
        <span
          key={i}
          className="particle"
          style={{
            left: `${f.left}%`,
            bottom: 0,
            width: f.size,
            height: f.size,
            animationDuration: `${f.duration}s`,
            animationDelay: `${f.delay}s`,
            ["--drift" as string]: `${f.drift}px`,
          }}
        />
      ))}
    </div>
  );
}
