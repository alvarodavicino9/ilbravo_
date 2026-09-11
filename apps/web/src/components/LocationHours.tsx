import type { BusinessInfo } from "../lib/api";

export function LocationHours({ business }: { business: BusinessInfo | null }) {
  if (!business) return null;

  return (
    <section id="ubicacion" className="border-b border-white/10">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
        <div>
          <h2 className="font-display text-4xl tracking-wide text-paper">Horarios</h2>
          <ul className="mt-6 space-y-2 text-paper/70">
            {business.hours.map((h) => (
              <li key={h.day} className="flex justify-between border-b border-white/5 pb-2">
                <span>{h.dayName}</span>
                <span className={h.hours ? "text-paper" : "text-paper/40"}>
                  {h.hours ? `${h.hours.open} – ${h.hours.close}` : "Cerrado"}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="font-display text-4xl tracking-wide text-paper">Dónde estamos</h2>
          <p className="mt-6 text-paper/70">{business.address}</p>
          <a
            href={business.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-full border border-white/20 px-6 py-2 text-sm text-paper hover:border-gold hover:text-gold"
          >
            Ver en Google Maps →
          </a>

          <div className="mt-8 flex gap-4">
            <a
              href={`https://wa.me/${business.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              className="text-paper/70 hover:text-gold"
            >
              WhatsApp: {business.phoneDisplay}
            </a>
          </div>
          <a
            href={business.instagram}
            target="_blank"
            rel="noreferrer"
            className="mt-2 block text-paper/70 hover:text-gold"
          >
            Instagram: {business.instagramHandle}
          </a>
        </div>
      </div>
    </section>
  );
}
