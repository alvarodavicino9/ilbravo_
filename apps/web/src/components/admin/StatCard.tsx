import type { ReactNode } from "react";
import { motion } from "framer-motion";

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  delay?: number;
}

/** Tarjeta de métrica para el dashboard del panel de admin. */
export function StatCard({ icon, label, value, hint, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="glass glow-ring rounded-2xl p-5"
    >
      <div className="flex items-center gap-2.5 text-paper/50">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
          {icon}
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-3 truncate font-display text-3xl tabular-nums text-paper">{value}</p>
      {hint && <p className="mt-1 truncate text-xs text-paper/40">{hint}</p>}
    </motion.div>
  );
}
