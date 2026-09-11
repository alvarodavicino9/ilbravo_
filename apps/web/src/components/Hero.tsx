import { motion, type Variants } from "framer-motion";
import { ArrowRight, MapPin, MessageCircle, Phone } from "lucide-react";
import type { BusinessInfo } from "../lib/api";
import { LinkButton } from "./ui/LinkButton";
import { LogoWatermark } from "./LogoWatermark";
import { Particles } from "./Particles";
import { BarberPole } from "./BarberPole";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

export function Hero({ business }: { business: BusinessInfo | null }) {
  return (
    <section
      id="inicio"
      className="grain relative overflow-hidden border-b border-white/10"
    >
      {/* Fondos decorativos */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-10%] h-[520px] w-[520px] rounded-full bg-gold/10 blur-[120px]" />
        <div className="absolute left-[-15%] top-1/2 h-[420px] w-[420px] rounded-full bg-ember/5 blur-[100px]" />
        <div
          className="absolute inset-x-0 top-0 h-[3px] opacity-70"
          style={{
            background:
              "repeating-linear-gradient(115deg, var(--color-gold) 0 18px, transparent 18px 36px, var(--color-paper) 36px 40px, transparent 40px 58px)",
          }}
        />
        <LogoWatermark className="absolute -right-24 top-[-8%] h-[520px] w-[520px] md:-right-16 md:top-[-20%] md:h-[640px] md:w-[640px]" />
        <Particles count={18} />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.9, ease: "easeOut" }}
          className="absolute right-[6%] top-1/2 hidden -translate-y-1/2 sm:block"
        >
          <BarberPole className="h-64 w-9 sm:h-72 sm:w-10 md:h-[26rem] md:w-14 lg:h-[30rem] lg:w-16" />
        </motion.div>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-24 md:py-36"
      >
        <motion.div variants={item}>
          <span className="rounded-full border border-gold/40 bg-gold/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-gold">
            {business?.category ?? "Peluquería & Barbería"} · Córdoba
          </span>
        </motion.div>

        <motion.h1
          variants={item}
          className="text-balance font-display text-6xl leading-[0.92] tracking-wide text-paper sm:text-7xl md:text-[7.5rem]"
        >
          Más que un corte:
          <br />
          <span className="bg-gradient-to-r from-gold-soft via-gold to-gold-dim bg-clip-text text-transparent">
            pura actitud.
          </span>
        </motion.h1>

        <motion.p variants={item} className="max-w-xl text-lg text-paper/70">
          Reservá tu turno online en segundos. Sin llamadas, sin esperas: elegís el
          servicio, el día y el horario que te queda cómodo — al toque también te
          responde nuestro asistente por WhatsApp.
        </motion.p>

        <motion.div variants={item} className="flex flex-wrap gap-4 pt-2">
          <LinkButton href="#reservar" size="lg" className="group">
            Reservar turno
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </LinkButton>
          {business && (
            <LinkButton
              href={`https://wa.me/${business.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              variant="outline"
              size="lg"
            >
              <MessageCircle className="h-4 w-4" />
              Consultar por WhatsApp
            </LinkButton>
          )}
        </motion.div>

        {business && (
          <motion.div
            variants={item}
            className="mt-8 flex flex-wrap gap-x-8 gap-y-3 text-sm text-paper/55"
          >
            <span className="inline-flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gold" /> {business.addressShort}
            </span>
            <span className="inline-flex items-center gap-2">
              <Phone className="h-4 w-4 text-gold" /> {business.phoneDisplay}
            </span>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        className="relative hidden justify-center pb-10 md:flex"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="h-9 w-5 rounded-full border border-white/20 p-1"
        >
          <div className="h-2 w-full rounded-full bg-gold" />
        </motion.div>
      </motion.div>
    </section>
  );
}
