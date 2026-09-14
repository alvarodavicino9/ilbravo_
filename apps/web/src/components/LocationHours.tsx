import { motion } from "framer-motion";
import { Clock3, MapPin, MessageCircle } from "lucide-react";
import type { BusinessInfo } from "../lib/api";
import { InstagramGlyph } from "./icons/InstagramGlyph";
import { LinkButton } from "./ui/LinkButton";

export function LocationHours({ business }: { business: BusinessInfo | null }) {
  if (!business) return null;

  const todayIdx = new Date().getDay();

  return (
    <section id="ubicacion" className="relative border-b border-white/10">
      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-20 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="glass rounded-2xl p-7"
        >
          <h2 className="flex items-center gap-2 font-display text-3xl tracking-wide text-paper">
            <Clock3 className="h-6 w-6 text-gold" /> Horarios
          </h2>
          <ul className="mt-6 space-y-1">
            {business.hours.map((h) => (
              <li
                key={h.day}
                className={`flex justify-between rounded-lg px-3 py-2.5 transition ${
                  h.day === todayIdx ? "bg-gold/10 text-paper" : "text-paper/70"
                }`}
              >
                <span className={h.day === todayIdx ? "font-semibold text-gold" : ""}>
                  {h.dayName}
                  {h.day === todayIdx && " · hoy"}
                </span>
                <span className={h.hours ? "" : "text-paper/40"}>
                  {h.hours ? `${h.hours.open} – ${h.hours.close}` : "Cerrado"}
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass relative overflow-hidden rounded-2xl p-7"
        >
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-3xl" />
          <h2 className="flex items-center gap-2 font-display text-3xl tracking-wide text-paper">
            <span className="relative flex h-6 w-6 items-center justify-center">
              <span className="absolute h-full w-full animate-ping rounded-full bg-gold/30" />
              <MapPin className="relative h-6 w-6 text-gold" />
            </span>
            Dónde estamos
          </h2>
          <p className="mt-6 text-paper/70">{business.address}</p>

          <a
            href={business.mapsUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Abrir ubicación en Google Maps"
            className="relative mt-5 block overflow-hidden rounded-xl border border-white/10 grayscale-[0.3] transition hover:grayscale-0"
          >
            {/*
              El mapa embebido (formato /maps?q=...&output=embed, sin API key)
              trae su propia UI interna de Google con links que no controlamos
              — al tocarlos en el celular a veces intentan abrir la app de Maps
              y, si algo en ese camino falla, terminan en un 404. Por eso el
              iframe queda puramente visual (pointer-events-none) y todo el
              recuadro es en realidad este link, que va directo a la URL de
              Maps que ya verificamos que funciona siempre.
            */}
            <iframe
              title="Ubicación de IL BRAVO en el mapa"
              src={`https://www.google.com/maps?q=${encodeURIComponent(business.address)}&output=embed`}
              className="pointer-events-none h-48 w-full border-0 sm:h-56"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              tabIndex={-1}
            />
          </a>

          <LinkButton href={business.mapsUrl} target="_blank" rel="noreferrer" variant="outline" size="sm" className="mt-4">
            Ver en Google Maps <span aria-hidden>→</span>
          </LinkButton>

          <div className="mt-8 space-y-2.5">
            <a
              href={`https://wa.me/${business.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-paper/70 transition hover:text-gold"
            >
              <MessageCircle className="h-4 w-4" /> {business.phoneDisplay}
            </a>
            <a
              href={business.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2.5 text-paper/70 transition hover:text-gold"
            >
              <InstagramGlyph className="h-4 w-4" /> {business.instagramHandle}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
