import { motion } from "framer-motion";
import logoPaper from "../assets/logo-paper.webp";

interface LogoProps {
  className?: string;
  imgClassName?: string;
  showWordmark?: boolean;
}

/** Isotipo real de IL BRAVO (tijera + "B"), provisto por el cliente. */
export function Logo({ className = "", imgClassName = "h-10 w-10", showWordmark = true }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <motion.img
        src={logoPaper}
        alt="IL BRAVO"
        className={`${imgClassName} select-none drop-shadow-[0_0_10px_rgba(201,162,75,0.15)]`}
        whileHover={{ rotate: -12, scale: 1.08 }}
        transition={{ type: "spring", stiffness: 300, damping: 12 }}
        draggable={false}
      />
      {showWordmark && (
        <span className="font-display text-2xl tracking-wide text-paper">IL BRAVO</span>
      )}
    </div>
  );
}
