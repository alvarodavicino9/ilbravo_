import { useEffect, useRef } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { CalendarRange, Scissors, Sparkles, Timer } from "lucide-react";
import type { BusinessInfo, Service } from "../lib/api";
import { useCountUp } from "../lib/hooks";

function StatNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 140, damping: 22 });
  const display = useCountUp(spring);

  useEffect(() => {
    if (inView) motionVal.set(value);
  }, [inView, value, motionVal]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

export function Stats({
  business,
  services,
}: {
  business: BusinessInfo | null;
  services: Service[];
}) {
  const openDays = business ? business.hours.filter((h) => h.hours).length : 6;
  const serviceCount = services.length;
  const minDuration = services.length ? Math.min(...services.map((s) => s.durationMinutes)) : 20;
  const maxDuration = services.length ? Math.max(...services.map((s) => s.durationMinutes)) : 60;

  const items = [
    {
      icon: CalendarRange,
      value: openDays,
      suffix: "",
      label: "días a la semana abiertos",
    },
    {
      icon: Scissors,
      value: serviceCount,
      suffix: "",
      label: "servicios a un click de distancia",
    },
    {
      icon: Timer,
      value: minDuration,
      suffix: `–${maxDuration}'`,
      label: "de duración según el servicio",
    },
    {
      icon: Sparkles,
      value: 100,
      suffix: "%",
      label: "de la reserva, online y al toque",
    },
  ];

  return (
    <section className="relative border-b border-white/10 bg-ink-soft/60">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-14 sm:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            className="flex flex-col items-center gap-2 text-center sm:items-start sm:text-left"
          >
            <it.icon className="h-5 w-5 text-gold" />
            <p className="font-display text-4xl text-paper">
              <StatNumber value={it.value} suffix={it.suffix} />
            </p>
            <p className="text-xs uppercase tracking-wide text-paper/50">{it.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
