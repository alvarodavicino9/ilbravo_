import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CalendarX,
  Download,
  DollarSign,
  Eye,
  EyeOff,
  Lock,
  LogOut,
  Phone,
  RefreshCw,
  Scissors,
  Search,
  TrendingUp,
} from "lucide-react";
import { api, ApiError, type AdminBooking } from "../lib/api";
import { Logo } from "../components/Logo";
import { BackgroundFX } from "../components/BackgroundFX";
import { Button } from "../components/ui/Button";
import { StatCard } from "../components/admin/StatCard";
import { StatusPill } from "../components/admin/StatusPill";

const TOKEN_KEY = "il-bravo-admin-token";
const currency = new Intl.NumberFormat("es-AR");

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

export function AdminPage() {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

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

  async function handleSync() {
    setSyncMsg("Sincronizando…");
    try {
      const res = await api.adminSyncSheet(token);
      setSyncMsg(
        res.synced
          ? `Google Sheets actualizado (${res.rows} turnos).`
          : "Google Sheets no está configurado todavía (ver README)."
      );
    } catch {
      setSyncMsg("Error al sincronizar.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setBookings([]);
    setSyncMsg(null);
  }

  const today = todayIso();

  const stats = useMemo(() => {
    const todayConfirmed = bookings.filter((b) => b.date === today && b.status === "confirmed");
    const revenueToday = todayConfirmed.reduce((sum, b) => sum + b.priceArs, 0);

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

    return { todayCount: todayConfirmed.length, revenueToday, upcoming7Count, topService, topCount };
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
          className="glass glow-ring relative w-full max-w-sm overflow-hidden rounded-2xl p-8"
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
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-3.5 w-3.5" />
              Exportar Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handleSync}>
              <RefreshCw className="h-3.5 w-3.5" />
              Sincronizar
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              <LogOut className="h-3.5 w-3.5" />
              Salir
            </Button>
          </div>
        </div>

        {syncMsg && (
          <p className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-2.5 text-sm text-gold">
            {syncMsg}
          </p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<CalendarDays className="h-4 w-4" />}
            label="Turnos hoy"
            value={String(stats.todayCount)}
            delay={0}
          />
          <StatCard
            icon={<DollarSign className="h-4 w-4" />}
            label="Ingresos hoy"
            value={`$${currency.format(stats.revenueToday)}`}
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

          <div className="glass flex w-fit gap-1 rounded-xl p-1">
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
              <div key={i} className="glass h-14 animate-pulse rounded-xl" />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="glass mt-6 flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center">
            <CalendarX className="h-8 w-8 text-paper/25" />
            <p className="text-paper/50">
              {bookings.length === 0 ? "No hay turnos próximos." : "Ningún turno coincide con la búsqueda."}
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="glass mt-6 overflow-x-auto rounded-2xl">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-white/10 text-[11px] font-semibold uppercase tracking-wide text-paper/40">
                <tr>
                  <th className="px-4 py-3.5">Fecha</th>
                  <th className="px-4 py-3.5">Hora</th>
                  <th className="px-4 py-3.5">Servicio</th>
                  <th className="px-4 py-3.5">Cliente</th>
                  <th className="px-4 py-3.5">Teléfono</th>
                  <th className="px-4 py-3.5">Precio</th>
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
                        b.date
                      )}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums text-paper/80">
                      {b.startTime}–{b.endTime}
                    </td>
                    <td className="px-4 py-3.5">{b.serviceName}</td>
                    <td className="px-4 py-3.5 font-medium">{b.customerName}</td>
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
    </div>
  );
}
