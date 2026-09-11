import { motion, type Variants } from "framer-motion";
import { CalendarCheck, MapPinned, MessagesSquare, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTilt } from "../lib/hooks";

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: CalendarCheck,
    title: "Reservá cuando quieras",
    desc: "Sacá tu turno online 24/7, sin tener que llamar ni esperar respuesta.",
  },
  {
    icon: MessagesSquare,
    title: "Asistente por WhatsApp",
    desc: "Consultá horarios, precios y reservá directo por chat, al toque.",
  },
  {
    icon: ShieldCheck,
    title: "Atención profesional",
    desc: "Oficio y prolijidad en cada corte, con la calidez de un local de barrio.",
  },
  {
    icon: MapPinned,
    title: "Zona Centro",
    desc: "Fácil de llegar, en el corazón de Córdoba Capital.",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

function FeatureCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  const { ref, rotateX, rotateY, onMouseMove, onMouseLeave } = useTilt<HTMLDivElement>(7);
  return (
    <motion.div
      ref={ref}
      variants={item}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformPerspective: 800 }}
      className="glow-ring group relative rounded-2xl border border-white/10 bg-white/[0.02] p-6 transition-colors hover:border-transparent"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold transition group-hover:bg-gold group-hover:text-ink">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 font-semibold text-paper">{title}</h3>
      <p className="mt-1.5 text-sm text-paper/55">{desc}</p>
    </motion.div>
  );
}

export function WhyUs() {
  return (
    <section id="nosotros" className="relative border-b border-white/10 bg-ink">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-display text-4xl tracking-wide text-paper">Por qué IL BRAVO</h2>
          <p className="mt-3 max-w-xl text-lg italic text-gold/90">
            "Barbería no es solo pelo: es actitud."
          </p>
          <p className="mt-2 max-w-xl text-paper/60">
            Lo que hace que reservar tu turno acá sea distinto.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
          style={{ perspective: 800 }}
        >
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
