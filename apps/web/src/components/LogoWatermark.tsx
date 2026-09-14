import logoGold from "../assets/logo-gold.webp";

/**
 * Marca de agua decorativa: el isotipo gigante girando muy lentamente de
 * fondo, con un resplandor difuso detrás y un degradado radial que lo
 * desvanece hacia los bordes — para que lea como un medallón de luz y no
 * como una línea dorada suelta cuando queda recortado por el viewport.
 */
export function LogoWatermark({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden>
      <div className="absolute inset-[8%] rounded-full bg-gold/[0.14] blur-[80px]" />
      <img
        src={logoGold}
        alt=""
        className="absolute inset-0 h-full w-full animate-spin-slow select-none opacity-[0.1]"
        style={{
          maskImage: "radial-gradient(circle, black 50%, transparent 76%)",
          WebkitMaskImage: "radial-gradient(circle, black 50%, transparent 76%)",
        }}
        draggable={false}
      />
    </div>
  );
}
