import { motion, type Variants } from "framer-motion";
import { CalendarClock, MessageCircleHeart, Scissors, UserCheck } from "lucide-react";
import { LinkButton } from "./ui/LinkButton";

const STEPS = [
  {
    icon: Scissors,
    title: "Elegí tu servicio",
    desc: "Corte, barba, color o lo que necesites — con precio y duración a la vista, sin sorpresas.",
  },
  {
    icon: CalendarClock,
    title: "Elegí día y horario",
    desc: "Vemos la disponibilidad real del local al instante y te mostramos solo los horarios libres.",
  },
  {
    icon: UserCheck,
    title: "Dejá tus datos",
    desc: "Nombre y WhatsApp. Nada de crear cuenta ni contraseñas — 30 segundos y listo.",
  },
  {
    icon: MessageCircleHeart,
    title: "Turno confirmado",
    desc: "Recibís la confirmación al instante, y si necesitás avisar algo, nos escribís por WhatsApp.",
  },
];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function HowItWorks() {
  return (
    <section className="relative border-b border-white/10">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-xs uppercase tracking-[0.25em] text-gold">Así de simple</span>
          <h2 className="mt-2 font-display text-4xl tracking-wide text-paper">Cómo reservar tu turno</h2>
          <p className="mt-2 max-w-xl text-paper/60">
            Todo el proceso lo hacés vos, desde el celular, en menos de un minuto.
          </p>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          className="relative mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* línea conectora, solo desktop */}
          <div className="pointer-events-none absolute inset-x-0 top-6 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />

          {STEPS.map((s, i) => (
            <motion.div key={s.title} variants={item} className="relative flex flex-col items-start">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-ink text-gold shadow-[0_0_0_6px_var(--color-ink)]">
                <s.icon className="h-5 w-5" />
              </div>
              <span className="mt-4 text-xs font-semibold uppercase tracking-widest text-gold/70">
                Paso {i + 1}
              </span>
              <h3 className="mt-1 font-display text-2xl tracking-wide text-paper">{s.title}</h3>
              <p className="mt-1.5 text-sm text-paper/55">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12"
        >
          <LinkButton href="#reservar" size="lg">
            Reservar ahora
          </LinkButton>
        </motion.div>
      </div>
    </section>
  );
}
