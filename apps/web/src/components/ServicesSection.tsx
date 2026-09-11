import type { Service } from "../lib/api";

const currency = new Intl.NumberFormat("es-AR");

export function ServicesSection({
  services,
  loading,
  selectedId,
  onSelect,
}: {
  services: Service[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <section id="servicios" className="border-b border-white/10 bg-ink-soft">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-4xl tracking-wide text-paper">Servicios</h2>
        <p className="mt-2 text-paper/60">Precios orientativos. Tocá un servicio para reservarlo.</p>

        {loading ? (
          <p className="mt-8 text-paper/50">Cargando servicios…</p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s) => {
              const active = s.id === selectedId;
              return (
                <button
                  key={s.id}
                  onClick={() => onSelect(s.id)}
                  className={`flex flex-col items-start rounded-2xl border p-6 text-left transition ${
                    active
                      ? "border-gold bg-gold/10"
                      : "border-white/10 bg-white/[0.02] hover:border-gold/50"
                  }`}
                >
                  <span className="font-display text-2xl tracking-wide text-paper">{s.name}</span>
                  <span className="mt-2 text-sm text-paper/50">{s.durationMinutes} minutos</span>
                  <span className="mt-4 text-xl font-semibold text-gold">
                    ${currency.format(s.priceArs)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
