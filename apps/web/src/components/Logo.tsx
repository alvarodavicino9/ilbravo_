interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

/**
 * Marca genérica (tijera + wordmark) para el prototipo. Cuando el
 * cliente confirme el logo definitivo, reemplazar por la imagen real:
 * guardar el archivo en src/assets/logo.png y usar <img src={logo} />
 * en vez de este componente.
 */
export function Logo({ className = "", variant = "light" }: LogoProps) {
  const ring = variant === "light" ? "border-paper" : "border-ink";
  const fg = variant === "light" ? "text-paper" : "text-ink";

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-full border ${ring}`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`h-5 w-5 ${fg}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <circle cx="6" cy="6" r="2.2" />
          <circle cx="6" cy="18" r="2.2" />
          <line x1="20" y1="4" x2="7.6" y2="16.4" />
          <line x1="7.6" y1="7.6" x2="20" y2="20" />
        </svg>
      </span>
      <span className={`font-display text-2xl tracking-wide ${fg}`}>IL BRAVO</span>
    </div>
  );
}
