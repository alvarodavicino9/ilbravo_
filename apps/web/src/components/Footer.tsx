import { MapPin, MessageCircle, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { BarberPole } from "./BarberPole";
import { InstagramGlyph } from "./icons/InstagramGlyph";
import type { BusinessInfo } from "../lib/api";

const LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#reservar", label: "Reservar" },
  { href: "#nosotros", label: "Nosotros" },
  { href: "#ubicacion", label: "Ubicación" },
];

export function Footer({ business }: { business: BusinessInfo | null }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-transparent to-black/40 px-5 pt-14">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="mx-auto grid max-w-6xl gap-10 pb-12 sm:grid-cols-2 md:grid-cols-4">
        <div className="col-span-2 flex flex-col items-start gap-4 sm:col-span-1">
          <Logo />
          <p className="max-w-xs text-sm text-paper/50">Oficio de barrio, en el corazón de Córdoba Capital.</p>
          <BarberPole className="h-10 w-3.5" />
        </div>

        <div className="flex flex-col items-start gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/40">Navegación</span>
          <nav className="flex flex-col gap-2.5 text-sm text-paper/65">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} className="w-fit transition hover:text-gold">
                {l.label}
              </a>
            ))}
          </nav>
        </div>

        {business && (
          <div className="flex flex-col items-start gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/40">Contacto</span>
            <a
              href={business.mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-start gap-2 text-sm text-paper/65 transition hover:text-gold"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              {business.addressShort}
            </a>
            <a
              href={`https://wa.me/${business.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-paper/65 transition hover:text-gold"
            >
              <Phone className="h-4 w-4 shrink-0" />
              {business.phoneDisplay}
            </a>
          </div>
        )}

        {business && (
          <div className="flex flex-col items-start gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-paper/40">Seguinos</span>
            <div className="flex items-center gap-3">
              <a
                href={`https://wa.me/${business.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                aria-label="WhatsApp"
                className="glass flex h-11 w-11 items-center justify-center rounded-full text-paper/70 transition hover:-translate-y-0.5 hover:text-gold hover:shadow-[0_8px_20px_-8px_rgba(201,162,75,0.6)]"
              >
                <MessageCircle className="h-5 w-5" />
              </a>
              <a
                href={business.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Instagram"
                className="glass flex h-11 w-11 items-center justify-center rounded-full text-paper/70 transition hover:-translate-y-0.5 hover:text-gold hover:shadow-[0_8px_20px_-8px_rgba(201,162,75,0.6)]"
              >
                <InstagramGlyph className="h-5 w-5" />
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl border-t border-white/10 py-6 text-center text-xs text-paper/35">
        © {new Date().getFullYear()} IL BRAVO. Todos los derechos reservados.
      </div>
    </footer>
  );
}
