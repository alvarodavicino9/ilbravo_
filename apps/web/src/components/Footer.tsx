import { MessageCircle } from "lucide-react";
import { Logo } from "./Logo";
import { BarberPole } from "./BarberPole";
import { InstagramGlyph } from "./icons/InstagramGlyph";
import type { BusinessInfo } from "../lib/api";

export function Footer({ business }: { business: BusinessInfo | null }) {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-transparent to-black/40 px-5 py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col items-center gap-4 md:items-start">
          <Logo />
          <p className="max-w-xs text-center text-sm text-paper/50 md:text-left">
            Oficio de barrio, en el corazón de Córdoba Capital.
          </p>
          <BarberPole className="h-10 w-3.5" />
        </div>

        {business && (
          <div className="flex flex-col items-center gap-4 md:items-start">
            <span className="text-xs uppercase tracking-[0.2em] text-paper/40">Seguinos</span>
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

        <div className="flex flex-col items-center gap-1.5 text-center text-sm text-paper/40 md:items-end md:text-right">
          <p>© {new Date().getFullYear()} IL BRAVO. Todos los derechos reservados.</p>
          <a href="/admin" className="transition hover:text-gold">
            Panel del local
          </a>
        </div>
      </div>
    </footer>
  );
}
