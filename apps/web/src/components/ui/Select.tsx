import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Elegí una opción",
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: SelectOption[];
  placeholder?: string;
  icon?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-xl border bg-ink/70 px-4 py-3 text-left text-paper outline-none backdrop-blur transition-all ${
          open
            ? "border-gold shadow-[0_0_0_3px_rgba(201,162,75,0.15)]"
            : "border-white/15 hover:border-white/30"
        }`}
      >
        <span className="flex min-w-0 items-center gap-2">
          {icon}
          <span className={`truncate ${selected ? "" : "text-paper/40"}`}>
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-paper/50 transition-transform duration-300 ${
            open ? "rotate-180 text-gold" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="popover absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-xl p-1.5 shadow-[0_24px_60px_-16px_rgba(0,0,0,0.85)]"
          >
            {options.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                    o.value === value
                      ? "bg-gold/15 text-gold"
                      : "text-paper/85 hover:bg-white/[0.07]"
                  }`}
                >
                  <span>
                    {o.label}
                    {o.sublabel && <span className="ml-1.5 text-paper/40">{o.sublabel}</span>}
                  </span>
                  {o.value === value && <Check className="h-3.5 w-3.5 shrink-0" />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
