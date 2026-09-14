import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  Loader2,
  PartyPopper,
  Phone,
  Scissors,
  User,
  Wallet,
} from "lucide-react";
import {
  api,
  ApiError,
  PAYMENT_METHOD_LABELS,
  type AvailabilityResponse,
  type BookingResult,
  type BusinessInfo,
  type PaymentMethod,
  type Service,
} from "../lib/api";
import { Select } from "./ui/Select";
import { Button } from "./ui/Button";

const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

const currency = new Intl.NumberFormat("es-AR");

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatIsoHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" });
}

function chipLabel(iso: string, index: number): { top: string; bottom: string } {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (index === 0) return { top: "Hoy", bottom: String(d) };
  if (index === 1) return { top: "Mañana", bottom: String(d) };
  return {
    top: date.toLocaleDateString("es-AR", { weekday: "short" }).replace(".", ""),
    bottom: String(d),
  };
}

const STEPS = [
  { n: 1, label: "Servicio" },
  { n: 2, label: "Día y horario" },
  { n: 3, label: "Tus datos" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="mb-8 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-colors ${
                current > s.n
                  ? "border-gold bg-gold text-ink"
                  : current === s.n
                    ? "border-gold text-gold"
                    : "border-white/15 text-paper/40"
              }`}
            >
              {current > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span
              className={`hidden text-sm sm:inline ${current >= s.n ? "text-paper" : "text-paper/40"}`}
            >
              {s.label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`h-px flex-1 ${current > s.n ? "bg-gold" : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export function BookingWizard({
  services,
  selectedServiceId,
  onSelectService,
  business,
}: {
  services: Service[];
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
  business?: BusinessInfo | null;
}) {
  const [date, setDate] = useState<string>(todayIso());
  const [customDate, setCustomDate] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<BookingResult | null>(null);

  const service = useMemo(
    () => services.find((s) => s.id === selectedServiceId) ?? null,
    [services, selectedServiceId]
  );

  const quickDays = useMemo(() => Array.from({ length: 5 }, (_, i) => addDaysIso(todayIso(), i)), []);

  const closedWeekdays = useMemo(() => {
    if (!business) return new Set<number>();
    return new Set(business.hours.filter((h) => !h.hours).map((h) => h.day));
  }, [business]);

  const step = confirmed ? 4 : !service ? 1 : !selectedTime ? 2 : 3;

  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: `$${currency.format(s.priceArs)} · ${s.durationMinutes} min`,
  }));

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
        paymentMethod: paymentMethod || null,
        source: "web",
      });
      setConfirmed(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No pudimos confirmar el turno, probá de nuevo.");
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
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
        className="glass rounded-3xl border-gold/30 p-10 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 300, damping: 15 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-ink"
        >
          <PartyPopper className="h-8 w-8" />
        </motion.div>
        <p className="mt-5 text-sm uppercase tracking-[0.2em] text-gold">Turno confirmado</p>
        <h3 className="mt-2 font-display text-3xl text-paper">{confirmed.serviceName}</h3>
        <p className="mt-2 text-paper/80">
          {formatIsoHuman(confirmed.date)} a las {confirmed.startTime} hs
        </p>
        <p className="mt-1 text-paper/60">A nombre de {confirmed.customerName}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-7"
          onClick={() => {
            setConfirmed(null);
            setName("");
            setPhone("");
            setPaymentMethod("");
          }}
        >
          Reservar otro turno
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 sm:p-8">
      <StepIndicator current={step} />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-6">
          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm text-paper/60">
              <Scissors className="h-3.5 w-3.5" /> Servicio
            </label>
            <Select
              value={selectedServiceId ?? ""}
              onChange={onSelectService}
              options={serviceOptions}
              placeholder="Elegí un servicio"
            />
          </div>

          <div>
            <label className="mb-2 flex items-center gap-1.5 text-sm text-paper/60">
              <CalendarDays className="h-3.5 w-3.5" /> Día
            </label>

            {!customDate ? (
              <div className="flex flex-wrap items-center gap-2">
                {quickDays.map((iso, i) => {
                  const weekday = new Date(iso + "T00:00:00").getDay();
                  const closed = closedWeekdays.has(weekday);
                  const label = chipLabel(iso, i);
                  const active = date === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setDate(iso)}
                      className={`flex min-w-[3.5rem] flex-col items-center rounded-xl border px-3 py-2 text-xs transition-all ${
                        active
                          ? "border-gold bg-gold/15 text-gold shadow-[0_0_16px_-4px_rgba(201,162,75,0.6)]"
                          : closed
                            ? "border-white/10 bg-white/[0.015] text-paper/30"
                            : "border-white/15 bg-white/[0.03] text-paper/75 hover:border-gold/50 hover:bg-white/[0.06]"
                      }`}
                    >
                      <span className="uppercase tracking-wide">{label.top}</span>
                      <span className="mt-0.5 font-display text-lg leading-none">{label.bottom}</span>
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setCustomDate(true)}
                  className="flex h-full min-h-[3.25rem] items-center gap-1.5 rounded-xl border border-dashed border-white/15 bg-white/[0.015] px-3 text-xs text-paper/60 transition hover:border-gold/50 hover:bg-white/[0.03] hover:text-gold"
                >
                  <CalendarPlus className="h-3.5 w-3.5" /> Otra fecha
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  min={todayIso()}
                  autoFocus
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-paper outline-none transition focus:border-gold [color-scheme:dark]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setCustomDate(false);
                    setDate(todayIso());
                  }}
                  className="shrink-0 text-xs text-paper/50 underline-offset-2 hover:text-gold hover:underline"
                >
                  Volver
                </button>
              </div>
            )}
          </div>

          <AnimatePresence>
            {service && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-paper/60"
              >
                <p>
                  <span className="text-paper">{service.name}</span> · {service.durationMinutes} min · $
                  {currency.format(service.priceArs)}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-1.5 text-sm text-paper/60">
            <Clock3 className="h-3.5 w-3.5" /> Horario
          </label>

          {!service && <p className="text-paper/40">Elegí un servicio para ver los horarios disponibles.</p>}

          {service && loadingSlots && (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
          )}

          {service && !loadingSlots && availability && !availability.open && (
            <p className="text-paper/50">Ese día el local está cerrado. Probá con otra fecha.</p>
          )}

          {service && !loadingSlots && availability?.open && availability.slots.length === 0 && (
            <p className="text-paper/50">No quedan horarios libres ese día. Probá con otra fecha.</p>
          )}

          {service && !loadingSlots && availability?.open && availability.slots.length > 0 && (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.02 } } }}
              className="grid grid-cols-4 gap-2 sm:grid-cols-5"
            >
              {availability.slots.map((t) => (
                <motion.button
                  key={t}
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  onClick={() => setSelectedTime(t)}
                  className={`rounded-lg border px-2 py-2.5 text-sm font-medium transition-all ${
                    selectedTime === t
                      ? "border-gold bg-gold text-ink shadow-[0_0_16px_-2px_rgba(201,162,75,0.6)]"
                      : "border-white/15 text-paper/80 hover:border-gold/60 hover:bg-white/[0.04]"
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </motion.div>
          )}

          <AnimatePresence>
            {service && selectedTime && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleSubmit}
                className="mt-6 space-y-4 overflow-hidden border-t border-white/10 pt-6"
              >
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-sm text-paper/60">
                    <User className="h-3.5 w-3.5" /> Nombre y apellido
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/30" />
                    <input
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-ink/70 py-3 pl-10 pr-4 text-paper outline-none transition focus:border-gold"
                      placeholder="Tu nombre"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-paper/60">WhatsApp / teléfono</label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/30" />
                    <input
                      required
                      minLength={6}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/15 bg-ink/70 py-3 pl-10 pr-4 text-paper outline-none transition focus:border-gold"
                      placeholder="351 123 4567"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 flex items-center gap-1.5 text-sm text-paper/60">
                    <Wallet className="h-3.5 w-3.5" /> Medio de pago (opcional)
                  </label>
                  <Select
                    value={paymentMethod}
                    onChange={(v) => setPaymentMethod(v as PaymentMethod)}
                    options={PAYMENT_METHOD_OPTIONS}
                    placeholder="Elegís al llegar"
                  />
                </div>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirmando…
                    </>
                  ) : (
                    `Confirmar turno · ${date} ${selectedTime}`
                  )}
                </Button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
