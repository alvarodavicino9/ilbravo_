import { useState } from "react";
import { Logo } from "./Logo";
import type { BusinessInfo } from "../lib/api";

const LINKS = [
  { href: "#servicios", label: "Servicios" },
  { href: "#reservar", label: "Reservar" },
  { href: "#ubicacion", label: "Ubicación" },
];

export function Header({ business }: { business: BusinessInfo | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <a href="#inicio" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-paper/80 transition hover:text-gold">
              {l.label}
            </a>
          ))}
          {business && (
            <a
              href={`https://wa.me/${business.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gold-soft"
            >
              Escribir por WhatsApp
            </a>
          )}
        </nav>

        <button
          className="text-paper md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8">
            {open ? (
              <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
            ) : (
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 px-5 pb-5 md:hidden">
          <div className="flex flex-col gap-4 pt-4">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="text-paper/80 hover:text-gold"
              >
                {l.label}
              </a>
            ))}
            {business && (
              <a
                href={`https://wa.me/${business.whatsappNumber}`}
                target="_blank"
                rel="noreferrer"
                className="w-fit rounded-full bg-gold px-5 py-2 text-sm font-semibold text-ink"
              >
                Escribir por WhatsApp
              </a>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
