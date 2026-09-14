import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CalendarPlus,
  CalendarX,
  CheckCircle2,
  Circle,
  Download,
  DollarSign,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Phone,
  Scissors,
  Search,
  StickyNote,
  TrendingUp,
  Wallet,
  X,
} from "lucide-react";
import {
  api,
  ApiError,
  PAYMENT_METHOD_LABELS,
  type AdminBooking,
  type PaymentMethod,
  type Service,
} from "../lib/api";
import { formatDMY, isoDaysFromNow, todayIso } from "../lib/date";
import { Logo } from "../components/Logo";
import { BackgroundFX } from "../components/BackgroundFX";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { StatCard } from "../components/admin/StatCard";
import { StatusPill } from "../components/admin/StatusPill";
import { RevenueChart } from "../components/admin/RevenueChart";

const TOKEN_KEY = "il-bravo-admin-token";
const currency = new Intl.NumberFormat("es-AR");

function formatHeaderDate(): string {
  const s = new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(
    new Date()
  );
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type StatusFilter = "all" | "confirmed" | "cancelled";

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "confirmed", label: "Confirmados" },
  { value: "cancelled", label: "Cancelados" },
];

const PAYMENT_METHOD_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((value) => ({
  value,
  label: PAYMENT_METHOD_LABELS[value],
}));

/** Insignia compacta para mostrar el medio de pago en la tabla. */
function PaymentBadge({
  value,
  onClick,
}: {
  value: PaymentMethod | null;
  onClick: () => void;
}) {
  if (!value) {
    return (
      <button
        onClick={onClick}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-white/15 px-2.5 py-1 text-xs text-paper/40 transition-colors hover:border-gold/50 hover:text-gold"
      >
        <Wallet className="h-3 w-3" />
        Marcar
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
    >
      <Wallet className="h-3 w-3" />
      {PAYMENT_METHOD_LABELS[value]}
    </button>
  );
}

/** Pastilla de estado de cobro; clickeable para marcar pagado/pendiente al instante. */
function PaidPill({ paid, onClick, busy }: { paid: boolean; onClick: () => void; busy?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        paid
          ? "bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/20"
          : "border border-dashed border-white/15 text-paper/40 hover:border-emerald-400/40 hover:text-emerald-400"
      }`}
    >
      {paid ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
      {paid ? "Pagado" : "Pendiente"}
    </button>
  );
}

/** Modal para editar el medio de pago, notas y estado de cobro de un turno existente. */
function PaymentEditModal({
  booking,
  onClose,
  onSaved,
}: {
  booking: AdminBooking;
  onClose: () => void;
  onSaved: (id: string, changes: { paymentMethod: PaymentMethod | null; notes: string | null; paid: boolean }) => void;
}) {
  const [value, setValue] = useState<PaymentMethod | "">(booking.paymentMethod ?? "");
  const [notes, setNotes] = useState(booking.notes ?? "");
  const [paid, setPaid] = useState(booking.paid);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await api.adminUpdateBooking(sessionStorage.getItem(TOKEN_KEY) || "", booking.id, {
        paymentMethod: value || null,
        notes: notes.trim() || null,
        paid,
      });
      onSaved(booking.id, { paymentMethod: value || null, notes: notes.trim() || null, paid });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Medio de pago" icon={<Wallet className="h-4 w-4" />}>
      <p className="text-sm text-paper/60">
        {booking.customerName} · {booking.serviceName} · {formatDMY(booking.date)} {booking.startTime}
      </p>

      <div className="mt-5">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
          Medio de pago
        </label>
        <Select
          value={value}
          onChange={(v) => setValue(v as PaymentMethod)}
          options={PAYMENT_METHOD_OPTIONS}
          placeholder="Sin definir"
        />
      </div>

      <button
        type="button"
        onClick={() => setPaid((v) => !v)}
        className={`mt-4 flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
          paid ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400" : "border-white/15 text-paper/70"
        }`}
      >
        {paid ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
        <span>
          <span className="font-medium">{paid ? "Cobrado" : "Marcar como cobrado"}</span>
          <span className="block text-xs opacity-70">Suma a los ingresos cuando está marcado.</span>
        </span>
      </button>

      <div className="mt-4">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
          Notas (opcional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Ej: pidió descuento, cliente frecuente, etc."
          className="w-full resize-none rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-gold"
        />
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3.5 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2.5">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </ModalShell>
  );
}

/** Modal para cargar un turno manual (llamada telefónica, cliente que se presenta en el local). */
function NewBookingModal({
  services,
  onClose,
  onCreated,
}: {
  services: Service[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [notes, setNotes] = useState("");
  const [paid, setPaid] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceOptions = services.map((s) => ({
    value: s.id,
    label: s.name,
    sublabel: `$${currency.format(s.priceArs)} · ${s.durationMinutes} min`,
  }));

  async function handleSave() {
    if (!serviceId || !date || !time || !name.trim() || !phone.trim()) {
      setError("Completá servicio, fecha, hora, nombre y teléfono.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.adminCreateBooking(sessionStorage.getItem(TOKEN_KEY) || "", {
        serviceId,
        date,
        startTime: time,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        paymentMethod: paymentMethod || null,
        notes: notes.trim() || null,
        paid,
      });
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el turno");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell onClose={onClose} title="Nuevo turno" icon={<CalendarPlus className="h-4 w-4" />}>
      <p className="text-sm text-paper/60">Para llamadas telefónicas o clientes que se presentan en el local.</p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Servicio
          </label>
          <Select
            value={serviceId}
            onChange={setServiceId}
            options={serviceOptions}
            placeholder="Elegí un servicio"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-gold [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Hora
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-gold [color-scheme:dark]"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Nombre y apellido
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Cliente"
            className="w-full rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-gold"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Teléfono
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="351 123 4567"
            className="w-full rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-gold"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Medio de pago (opcional)
          </label>
          <Select
            value={paymentMethod}
            onChange={(v) => setPaymentMethod(v as PaymentMethod)}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder="Sin definir"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Notas (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-white/15 bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition-colors focus:border-gold"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setPaid((v) => !v)}
        className={`mt-4 flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
          paid ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-400" : "border-white/15 text-paper/70"
        }`}
      >
        {paid ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Circle className="h-4 w-4 shrink-0" />}
        <span>
          <span className="font-medium">{paid ? "Se cobra ahora" : "Marcar como cobrado ahora"}</span>
          <span className="block text-xs opacity-70">Para cuando el cliente paga en el momento.</span>
        </span>
      </button>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3.5 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-2.5">
        <Button type="button" variant="outline" size="sm" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" size="sm" onClick={handleSave} disabled={saving}>
          {saving ? "Cargando…" : "Cargar turno"}
        </Button>
      </div>
    </ModalShell>
  );
}

function ModalShell({
  title,
  icon,
  onClose,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 backdrop-blur-sm px-4 py-8"
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 340, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
        className="panel glow-ring max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-paper">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10 text-gold">
              {icon}
            </span>
            <h2 className="font-display text-xl tracking-wide">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-paper/40 transition-colors hover:bg-white/[0.06] hover:text-paper"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function AdminPage() {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingPayment, setEditingPayment] = useState<AdminBooking | null>(null);
  const [showNewBooking, setShowNewBooking] = useState(false);
  const [togglingPaidId, setTogglingPaidId] = useState<string | null>(null);

  async function load(currentToken: string) {
    setLoading(true);
    setError(null);
    try {
      const rows = await api.adminListBookings(currentToken, { from: todayIso() });
      setBookings(rows);
      sessionStorage.setItem(TOKEN_KEY, currentToken);
      setToken(currentToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
      sessionStorage.removeItem(TOKEN_KEY);
      setToken("");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (token) load(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    api.getServices().then(setServices).catch(() => {});
  }, [token]);

  async function handleCancel(id: string) {
    if (!confirm("¿Cancelar este turno?")) return;
    await api.adminCancelBooking(token, id);
    load(token);
  }

  async function handleExport() {
    const blob = await api.adminExportExcel(token);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "il-bravo-agenda.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setBookings([]);
  }

  function applyPaymentUpdate(
    id: string,
    changes: { paymentMethod: PaymentMethod | null; notes: string | null; paid: boolean }
  ) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...changes } : b)));
  }

  async function handleTogglePaid(b: AdminBooking) {
    const next = !b.paid;
    setTogglingPaidId(b.id);
    setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paid: next } : x)));
    try {
      await api.adminUpdateBooking(token, b.id, { paid: next });
    } catch {
      setBookings((prev) => prev.map((x) => (x.id === b.id ? { ...x, paid: !next } : x)));
    } finally {
      setTogglingPaidId(null);
    }
  }

  const today = todayIso();

  const stats = useMemo(() => {
    const todayConfirmed = bookings.filter((b) => b.date === today && b.status === "confirmed");
    const revenueToday = todayConfirmed.filter((b) => b.paid).reduce((sum, b) => sum + b.priceArs, 0);
    const pendingToday = todayConfirmed.filter((b) => !b.paid).reduce((sum, b) => sum + b.priceArs, 0);

    const in7 = isoDaysFromNow(7);
    const upcoming7Count = bookings.filter(
      (b) => b.status === "confirmed" && b.date >= today && b.date <= in7
    ).length;

    const serviceCounts = new Map<string, number>();
    for (const b of bookings) {
      if (b.status !== "confirmed") continue;
      serviceCounts.set(b.serviceName, (serviceCounts.get(b.serviceName) ?? 0) + 1);
    }
    let topService = "—";
    let topCount = 0;
    for (const [name, count] of serviceCounts) {
      if (count > topCount) {
        topService = name;
        topCount = count;
      }
    }

    return { todayCount: todayConfirmed.length, revenueToday, pendingToday, upcoming7Count, topService, topCount };
  }, [bookings, today]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const qDigits = q.replace(/\D/g, "");
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!q) return true;
      const matchesName = b.customerName.toLowerCase().includes(q);
      const matchesPhone = qDigits.length > 0 && b.customerPhone.replace(/\D/g, "").includes(qDigits);
      const matchesService = b.serviceName.toLowerCase().includes(q);
      return matchesName || matchesPhone || matchesService;
    });
  }, [bookings, search, statusFilter]);

  if (!token) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-5 py-12">
        <BackgroundFX />
        <motion.form
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onSubmit={(e) => {
            e.preventDefault();
            if (!tokenInput.trim()) return;
            setSubmitting(true);
            load(tokenInput.trim());
          }}
          className="panel glow-ring relative w-full max-w-sm overflow-hidden rounded-2xl p-8"
        >
          <div className="barber-pole absolute inset-x-0 top-0 h-1.5" />

          <div className="flex flex-col items-center text-center">
            <Logo showWordmark={false} imgClassName="h-14 w-14" />
            <h1 className="mt-4 font-display text-3xl tracking-wide text-paper">Panel del local</h1>
            <p className="mt-1.5 text-sm text-paper/50">
              Ingresá el token de administración para gestionar los turnos.
            </p>
          </div>

          <label className="mt-8 block text-xs font-semibold uppercase tracking-wide text-paper/50">
            Token de acceso
          </label>
          <div className="relative mt-2">
            <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/40" />
            <input
              type={showToken ? "text" : "password"}
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-ink/70 py-3 pl-11 pr-11 text-paper outline-none transition-colors focus:border-gold"
              placeholder="••••••••••••"
              autoFocus
              autoComplete="off"
            />
            <button
              type="button"
              onClick={() => setShowToken((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-paper/40 transition-colors hover:text-gold"
              tabIndex={-1}
            >
              {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-400/20 bg-red-400/5 px-3.5 py-3 text-sm text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" className="mt-6 w-full" disabled={submitting || !tokenInput.trim()}>
            {submitting ? "Verificando…" : "Entrar"}
          </Button>
        </motion.form>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-5 py-8 text-paper sm:py-10">
      <BackgroundFX />
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Logo showWordmark={false} imgClassName="h-11 w-11" />
            <div>
              <h1 className="font-display text-2xl tracking-wide sm:text-3xl">Panel del local</h1>
              <p className="text-sm text-paper/45">{formatHeaderDate()}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Button size="sm" onClick={() => setShowNewBooking(true)}>
              <CalendarPlus className="h-3.5 w-3.5" />
              Nuevo turno
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar Excel
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Turnos hoy"
            value={String(stats.todayCount)}
            delay={0}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Cobrado hoy"
            value={`$${currency.format(stats.revenueToday)}`}
            hint={stats.pendingToday > 0 ? `+ $${currency.format(stats.pendingToday)} pendiente` : undefined}
            delay={0.05}
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="Próximos 7 días"
            value={String(stats.upcoming7Count)}
            delay={0.1}
          />
          <StatCard
            icon={<Scissors className="h-4 w-4" />}
            label="Servicio más pedido"
            value={stats.topService}
            hint={stats.topCount > 0 ? `${stats.topCount} turnos` : undefined}
            delay={0.15}
          />
        </div>

        <div className="mt-6">
          <RevenueChart token={token} />
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-paper/40" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, teléfono o servicio…"
              className="w-full rounded-xl border border-white/15 bg-ink/70 py-2.5 pl-10 pr-3 text-sm text-paper outline-none transition-colors focus:border-gold"
            />
          </div>

          <div className="panel flex w-fit gap-1 rounded-xl p-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === f.value ? "bg-gold text-ink" : "text-paper/60 hover:text-paper"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mt-6 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="panel h-14 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="panel mt-6 flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center">
            <CalendarX className="h-8 w-8 text-paper/25" />
            <p className="text-paper/50">
              {bookings.length === 0 ? "No hay turnos próximos." : "Ningún turno coincide con la búsqueda."}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="panel mt-6 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wide text-paper/40">
                <tr>
                  <th className="px-4 py-3.5">Fecha</th>
                  <th className="px-4 py-3.5">Hora</th>
                  <th className="px-4 py-3.5">Servicio</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Teléfono</th>
                  <th className="px-4 py-3.5">Precio</th>
                  <th className="px-4 py-3.5">Pago</th>
                  <th className="px-4 py-3.5">Estado</th>
                  <th className="px-4 py-3.5">Origen</th>
                  <th className="px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-white/5 transition-colors hover:bg-white/[0.03]">
                    <td className="px-4 py-3.5">
                      {b.date === today ? (
                        <span className="font-semibold text-gold">Hoy</span>
                      ) : (
                        formatDMY(b.date)
                      )}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-paper/80">
                      {b.startTime}–{b.endTime}
                    </td>
                    <td className="px-4 py-3.5">{b.serviceName}</td>
                    <td className="px-4 py-3.5 font-medium">
                      <span className="inline-flex items-center gap-1.5">
                        {b.customerName}
                        {b.notes && (
                          <span title={b.notes}>
                            <StickyNote className="h-3.5 w-3.5 shrink-0 text-gold/70" />
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <a
                        href={`https://wa.me/${b.customerPhone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-paper/70 transition-colors hover:text-gold"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        {b.customerPhone}
                      </a>
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">${currency.format(b.priceArs)}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col items-start gap-1">
                        <PaymentBadge value={b.paymentMethod} onClick={() => setEditingPayment(b)} />
                        {b.status === "confirmed" && (
                          <PaidPill
                            paid={b.paid}
                            onClick={() => handleTogglePaid(b)}
                            busy={togglingPaidId === b.id}
                          />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusPill status={b.status} />
                    </td>
                    <td className="px-4 py-3.5 capitalize text-paper/60">{b.source}</td>
                    <td className="px-4 py-3.5 text-right">
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="text-xs font-medium text-red-400 hover:underline"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {editingPayment && (
          <PaymentEditModal
            booking={editingPayment}
            onClose={() => setEditingPayment(null)}
            onSaved={applyPaymentUpdate}
          />
        )}
        {showNewBooking && (
          <NewBookingModal
            services={services}
            onClose={() => setShowNewBooking(false)}
            onCreated={() => load(token)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
