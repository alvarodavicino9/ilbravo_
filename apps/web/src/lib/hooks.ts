import { useEffect, useRef, useState } from "react";
import { useMotionValue, useSpring, useTransform, type MotionValue } from "framer-motion";

/** true una vez que el usuario scrolleó más de `threshold` px. */
export function useScrolled(threshold = 8): boolean {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

/** Devuelve el id de la sección visible actualmente, para resaltar el nav. */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}

/**
 * Efecto de "tilt" 3D sutil: la tarjeta se inclina levemente siguiendo al
 * cursor. Se usa en las tarjetas de servicios / features para un toque
 * premium sin depender de librerías extra.
 */
export function useTilt<T extends HTMLElement>(strength = 10) {
  const ref = useRef<T>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [strength, -strength]), {
    stiffness: 300,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-strength, strength]), {
    stiffness: 300,
    damping: 25,
  });

  function onMouseMove(e: React.MouseEvent<T>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    x.set(0);
    y.set(0);
  }

  return { ref, rotateX, rotateY, onMouseMove, onMouseLeave };
}

/** Cuenta ascendente animada para números de estadísticas. */
export function useCountUp(motionValue: MotionValue<number>): number {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const unsub = motionValue.on("change", (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [motionValue]);
  return display;
}
