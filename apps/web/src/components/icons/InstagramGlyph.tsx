/**
 * lucide-react quitó los íconos de marcas (Instagram, etc.) de versiones
 * recientes. Este es un glifo genérico simple (cámara + cuadrado
 * redondeado), no un logo oficial — mismo criterio que el ícono de
 * WhatsApp ya usado en el FAB.
 */
export function InstagramGlyph({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}
