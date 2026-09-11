import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logo } from "./Logo";
import { useActiveSection, useScrolled } from "../lib/hooks";

const LINKS = [
  { href: "#servicios", id: "servicios", label: "Servicios" },
  { href: "#reservar", id: "reservar", label: "Reservar" },
  { href: "#nosotros", id: "nosotros", label: "Nosotros" },
  { href: "#ubicacion", id: "ubicacion", label: "Ubicación" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const scrolled = useScrolled(12);
  const active = useActiveSection(LINKS.map((l) => l.id));

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "glass border-b border-white/10 py-3 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]"
          : "border-b border-transparent bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5">
        <a href="#inicio" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={`relative text-sm transition ${
                active === l.id ? "text-gold" : "text-paper/75 hover:text-paper"
              }`}
            >
              {l.label}
              {active === l.id && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1.5 left-0 right-0 h-px bg-gold"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </a>
          ))}
        </nav>

        <button
          className="text-paper md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Abrir menú"
        >
          {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="popover overflow-hidden border-t border-white/10 md:hidden"
          >
            <div className="flex flex-col gap-4 px-5 pb-6 pt-5">
              {LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={active === l.id ? "text-gold" : "text-paper/80 hover:text-gold"}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
