import { useEffect, useMemo, useState } from "react";
import { api, ApiError, type AvailabilityResponse, type BookingResult, type Service } from "../lib/api";

const currency = new Intl.NumberFormat("es-AR");

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatIsoHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" });
}

export function BookingWizard({
  services,
  selectedServiceId,
  onSelectService,
}: {
  services: Service[];
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
}) {
  const [date, setDate] = useState<string>(todayIso());
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<BookingResult | null>(null);

  const service = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  useEffect(() => {
    setSelectedTime(null);
    setConfirmed(null);
    if (!service) {
      setAvailability(null);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    api
      .getAvailability(date, service.id)
      .then((res) => {
        if (!cancelled) setAvailability(res);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, service]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.createBooking({
        serviceId: service.id,
        date,
        startTime: selectedTime,
        customerName: name,
        customerPhone: phone,
        source: "web",
      });
      setConfirmed(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos confirmar el turno, probá de nuevo.");
      // El horario pudo haberse ocupado justo ahora: refrescamos la disponibilidad.
      if (service) {
        api.getAvailability(date, service.id).then(setAvailability).catch(() => {});
      }
      setSelectedTime(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/10 p-8 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-gold">Turno confirmado</p>
        <h3 className="mt-3 font-display text-3xl text-paper">{confirmed.serviceName}</h3>
        <p className="mt-2 text-paper/80">
          {formatIsoHuman(confirmed.date)} a las {confirmed.startTime} hs
        </p>
        <p className="mt-1 text-paper/60">A nombre de {confirmed.customerName}</p>
        <button
          onClick={() => {
            setConfirmed(null);
            setName("");
            setPhone("");
          }}
          className="mt-6 rounded-full border border-white/20 px-6 py-2 text-sm text-paper hover:border-gold hover:text-gold"
        >
          Reservar otro turno
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <div className="space-y-6">
        <div>
          <label className="mb-2 block text-sm text-paper/60">Servicio</label>
          <select
            value={selectedServiceId ?? ""}
            onChange={(e) => onSelectService(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-paper outline-none focus:border-gold"
          >
            <option value="" disabled>
              Elegí un servicio
            </option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — ${currency.format(s.priceArs)} ({s.durationMinutes} min)
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm text-paper/60">Día</label>
          <input
            type="date"
            value={date}
            min={todayIso()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-paper outline-none focus:border-gold [color-scheme:dark]"
          />
        </div>

        {service && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-paper/60">
            <p>
              <span className="text-paper">{service.name}</span> · {service.durationMinutes} min · $
              {currency.format(service.priceArs)}
            </p>
          </div>
        )}
      </div>

      <div>
        <label className="mb-2 block text-sm text-paper/60">Horario</label>

        {!service && <p className="text-paper/40">Elegí un servicio para ver los horarios disponibles.</p>}

        {service && loadingSlots && <p className="text-paper/40">Buscando horarios…</p>}

        {service && !loadingSlots && availability && !availability.open && (
          <p className="text-paper/50">Ese día el local está cerrado. Probá con otra fecha.</p>
        )}

        {service && !loadingSlots && availability?.open && availability.slots.length === 0 && (
          <p className="text-paper/50">No quedan horarios libres ese día. Probá con otra fecha.</p>
        )}

        {service && !loadingSlots && availability?.open && availability.slots.length > 0 && (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {availability.slots.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTime(t)}
                className={`rounded-lg border px-2 py-2 text-sm transition ${
                  selectedTime === t
                    ? "border-gold bg-gold text-ink font-semibold"
                    : "border-white/15 text-paper/80 hover:border-gold/60"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {service && selectedTime && (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-t border-white/10 pt-6">
            <div>
              <label className="mb-1 block text-sm text-paper/60">Nombre y apellido</label>
              <input
                required
                minLength={2}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-paper outline-none focus:border-gold"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-paper/60">WhatsApp / teléfono</label>
              <input
                required
                minLength={6}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-paper outline-none focus:border-gold"
                placeholder="351 123 4567"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-gold py-3 font-semibold text-ink transition hover:bg-gold-soft disabled:opacity-50"
            >
              {submitting ? "Confirmando…" : `Confirmar turno · ${date} ${selectedTime}`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
