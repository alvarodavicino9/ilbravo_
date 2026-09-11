import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck, MessageCircleQuestion, RefreshCcw, Tag, X } from "lucide-react";
import type { BusinessInfo } from "../lib/api";

interface QuickMessage {
  icon: typeof CalendarCheck;
  label: string;
  message: string;
}

const QUICK_MESSAGES: QuickMessage[] = [
  {
    icon: CalendarCheck,
    label: "Reservar un turno",
    message: "Hola! Quiero reservar un turno en IL BRAVO.",
  },
  {
    icon: Tag,
    label: "Consultar precios y servicios",
    message: "Hola! Quería consultar los precios y servicios disponibles.",
  },
  {
    icon: RefreshCcw,
    label: "Cambiar o cancelar un turno",
    message: "Hola! Necesito cambiar o cancelar un turno que ya tengo reservado.",
  },
  {
    icon: MessageCircleQuestion,
    label: "Otra consulta",
    message: "Hola! Tengo una consulta.",
  },
];

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d="M16.02 3C9.4 3 4 8.4 4 15.02c0 2.36.62 4.57 1.7 6.48L4 29l7.68-1.66a11.94 11.94 0 0 0 4.34.81h.01c6.62 0 12.02-5.4 12.02-12.03C28.05 8.4 22.65 3 16.02 3zm0 21.9h-.01a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.78.82.8-3.69-.24-.38a9.87 9.87 0 0 1-1.52-5.24c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.92 7.02c0 5.48-4.46 9.94-9.94 9.94zm5.45-7.45c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.57-.48-.5-.67-.5-.17-.01-.37-.01-.57-.01-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.47s1.06 2.87 1.21 3.07c.15.2 2.09 3.19 5.06 4.47.71.31 1.26.49 1.69.63.71.22 1.35.19 1.86.12.57-.08 1.76-.72 2-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35z" />
    </svg>
  );
}

export function WhatsappFab({ business }: { business: BusinessInfo | null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  if (!business) return null;

  function waLink(message: string) {
    return `https://wa.me/${business!.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div ref={ref} className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.94 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="popover w-72 overflow-hidden rounded-2xl shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)]"
          >
            <div className="flex items-center gap-2.5 border-b border-white/10 bg-[#25D366]/10 px-4 py-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
                <WhatsAppIcon className="h-4 w-4 text-white" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-paper">IL BRAVO</p>
                <p className="truncate text-xs text-paper/50">¿En qué te ayudamos?</p>
              </div>
            </div>

            <div className="flex flex-col p-1.5">
              {QUICK_MESSAGES.map((qm) => (
                <a
                  key={qm.label}
                  href={waLink(qm.message)}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-paper/85 transition hover:bg-white/[0.06] hover:text-gold"
                >
                  <qm.icon className="h-4 w-4 shrink-0 text-gold" />
                  {qm.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        className={`flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg shadow-black/40 ${
          open ? "" : "animate-pulse-ring"
        }`}
        aria-label="Escribir por WhatsApp"
        aria-expanded={open}
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <X className="h-6 w-6 text-white" />
            </motion.span>
          ) : (
            <motion.span key="icon" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
              <WhatsAppIcon className="h-7 w-7 fill-white" />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
