import { motion, type Variants } from "framer-motion";
import { Baby, Check, Clock3, Palette, Scissors, Sparkles, type LucideIcon } from "lucide-react";
import type { Service } from "../lib/api";
import { useTilt } from "../lib/hooks";

const currency = new Intl.NumberFormat("es-AR");

const ICONS: Record<string, LucideIcon> = {
  "corte-clasico": Scissors,
  "corte-barba": Scissors,
  barba: Sparkles,
  color: Palette,
  "corte-nino": Baby,
};

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

function ServiceCard({
  service,
  active,
  onSelect,
}: {
  service: Service;
  active: boolean;
  onSelect: () => void;
}) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt<HTMLButtonElement>(6);
  const Icon = ICONS[service.id] ?? Scissors;

  return (
    <motion.button
      ref={ref}
      variants={item}
      onClick={onSelect}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className={`glow-ring group relative flex flex-col items-start overflow-hidden rounded-2xl border p-6 text-left transition-colors duration-300 ${
        active
          ? "border-gold bg-gold/10 shadow-[0_0_30px_-8px_rgba(201,162,75,0.5)]"
          : "border-white/10 bg-white/[0.02] hover:border-transparent hover:bg-white/[0.04]"
      }`}
    >
      {active && (
        <motion.span
          layoutId="service-check"
          className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-ink"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </motion.span>
      )}

      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
          active ? "bg-gold text-ink" : "bg-gold/10 text-gold group-hover:bg-gold/20"
        }`}
      >
        <Icon className="h-5 w-5" />
      </div>

      <span className="mt-4 font-display text-2xl tracking-wide text-paper">{service.name}</span>
      <span className="mt-1 inline-flex items-center gap-1.5 text-sm text-paper/50">
        <Clock3 className="h-3.5 w-3.5" /> {service.durationMinutes} minutos
      </span>
      <span className="mt-4 text-xl font-semibold text-gold">
        ${currency.format(service.priceArs)}
      </span>
    </motion.button>
  );
}

export function ServicesSection({
  services,
  loading,
  selectedId,
  onSelect,
}: {
  services: Service[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section id="servicios" className="relative border-b border-white/10 bg-ink-soft">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-4xl tracking-wide text-paper">Servicios</h2>
          <p className="mt-2 text-paper/60">Precios orientativos. Tocá un servicio para reservarlo.</p>
        </motion.div>

        {loading ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl border border-white/10 bg-white/[0.03]" />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
            style={{ perspective: 800 }}
          >
            {services.map((s) => (
              <ServiceCard key={s.id} service={s} active={s.id === selectedId} onSelect={() => onSelect(s.id)} />
            ))}
          </motion.div>
        )}
      </div>
    </section>
  );
}
