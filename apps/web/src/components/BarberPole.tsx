/**
 * Poste de barbería clásico, animado con CSS puro (repeating-linear-gradient
 * + desplazamiento de background-position). Referencia visual directa al
 * oficio, con caños metálicos, brillo de vidrio y sombra propia para que
 * lea como un objeto real y no como una barra plana.
 */
export function BarberPole({ className = "" }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* sombra de piso, da sensación de volumen */}
      <div className="absolute -bottom-3 left-1/2 h-4 w-[70%] -translate-x-1/2 rounded-full bg-black/50 blur-md" />

      <div className="relative isolate h-full w-full overflow-hidden rounded-full shadow-[0_18px_40px_-12px_rgba(0,0,0,0.75)] ring-1 ring-white/15">
        <div className="barber-pole absolute inset-0" />

        {/* brillo de vidrio: una franja clara que sugiere curvatura cilíndrica */}
        <div className="pointer-events-none absolute inset-y-0 left-[16%] w-[18%] rounded-full bg-gradient-to-r from-white/50 via-white/10 to-transparent blur-[1.5px]" />
        <div className="pointer-events-none absolute inset-y-0 right-[10%] w-[10%] rounded-full bg-gradient-to-l from-black/40 to-transparent blur-[1px]" />

        {/* tapas metálicas en los extremos */}
        <div className="pointer-events-none absolute inset-x-[-10%] top-0 h-[9%] rounded-t-full bg-gradient-to-b from-[#f2e9d4] via-[#c9a24b] to-[#8a6f39] shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
        <div className="pointer-events-none absolute inset-x-[-10%] bottom-0 h-[9%] rounded-b-full bg-gradient-to-t from-[#f2e9d4] via-[#c9a24b] to-[#8a6f39] shadow-[0_-2px_4px_rgba(0,0,0,0.5)]" />
      </div>
    </div>
  );
}
