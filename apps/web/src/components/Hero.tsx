import type { BusinessInfo } from "../lib/api";

export function Hero({ business }: { business: BusinessInfo | null }) {
  return (
    <section
      id="inicio"
      className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_20%_-10%,rgba(201,162,75,0.18),transparent_45%)]"
    >
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-5 py-24 md:py-32">
        <span className="rounded-full border border-gold/40 px-4 py-1 text-xs uppercase tracking-[0.2em] text-gold">
          {business?.category ?? "Peluquería & Barbería"}
        </span>

        <h1 className="font-display text-6xl leading-[0.95] tracking-wide text-paper sm:text-7xl md:text-8xl">
          Estilo con
          <br />
          <span className="text-gold">oficio de barrio.</span>
        </h1>

        <p className="max-w-xl text-lg text-paper/70">
          Reservá tu turno online en segundos. Sin llamadas, sin esperas: elegís el
          servicio, el día y el horario que te queda cómodo.
        </p>

        <div className="flex flex-wrap gap-4 pt-2">
          <a
            href="#reservar"
            className="rounded-full bg-gold px-7 py-3 font-semibold text-ink transition hover:bg-gold-soft"
          >
            Reservar turno
          </a>
          {business && (
            <a
              href={`https://wa.me/${business.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="rounded-full border border-white/20 px-7 py-3 font-semibold text-paper transition hover:border-gold hover:text-gold"
            >
              Consultar por WhatsApp
            </a>
          )}
        </div>

        {business && (
          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-paper/60">
            <span>📍 {business.addressShort}</span>
            <span>📞 {business.phoneDisplay}</span>
          </div>
        )}
      </div>
    </section>
  );
}
