import { useEffect, useState } from "react";
import { api, ApiError, type AdminBooking } from "../lib/api";
import { Logo } from "../components/Logo";

const TOKEN_KEY = "il-bravo-admin-token";
const currency = new Intl.NumberFormat("es-AR");

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function AdminPage() {
  const [token, setToken] = useState<string>(() => sessionStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

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

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load(tokenInput.trim());
          }}
          className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.02] p-8"
        >
          <Logo className="mb-6" />
          <h1 className="font-display text-2xl text-paper">Panel del local</h1>
          <p className="mt-1 text-sm text-paper/50">Ingresá el token de administración (ADMIN_TOKEN).</p>
          <input
            type="password"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            className="mt-6 w-full rounded-xl border border-white/15 bg-ink px-4 py-3 text-paper outline-none focus:border-gold"
            placeholder="Token"
            autoFocus
          />
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
          <button className="mt-6 w-full rounded-full bg-gold py-3 font-semibold text-ink hover:bg-gold-soft">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink px-5 py-10 text-paper">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Logo />
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="rounded-full border border-white/20 px-5 py-2 text-sm hover:border-gold hover:text-gold"
            >
              ⬇ Exportar Excel
            </button>
            <button
              onClick={handleSync}
              className="rounded-full border border-white/20 px-5 py-2 text-sm hover:border-gold hover:text-gold"
            >
              ⟳ Sincronizar Google Sheets
            </button>
            <button
              onClick={() => {
                sessionStorage.removeItem(TOKEN_KEY);
                setToken("");
              }}
              className="rounded-full border border-white/20 px-5 py-2 text-sm hover:border-red-400 hover:text-red-400"
            >
              Salir
            </button>
          </div>
        </div>

        {syncMsg && <p className="mt-4 text-sm text-gold">{syncMsg}</p>}

        <h1 className="mt-8 font-display text-3xl tracking-wide">Próximos turnos</h1>

        {loading && <p className="mt-6 text-paper/50">Cargando…</p>}

        {!loading && bookings.length === 0 && <p className="mt-6 text-paper/50">No hay turnos próximos.</p>}

        {!loading && bookings.length > 0 && (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="bg-white/5 text-paper/60">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Hora</th>
                  <th className="px-4 py-3">Servicio</th>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Origen</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{b.date}</td>
                    <td className="px-4 py-3">
                      {b.startTime}–{b.endTime}
                    </td>
                    <td className="px-4 py-3">{b.serviceName}</td>
                    <td className="px-4 py-3">{b.customerName}</td>
                    <td className="px-4 py-3">{b.customerPhone}</td>
                    <td className="px-4 py-3">${currency.format(b.priceArs)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          b.status === "cancelled" ? "text-red-400" : "text-emerald-400"
                        }
                      >
                        {b.status === "cancelled" ? "Cancelado" : "Confirmado"}
                      </span>
                    </td>
                    <td className="px-4 py-3 capitalize">{b.source}</td>
                    <td className="px-4 py-3">
                      {b.status === "confirmed" && (
                        <button
                          onClick={() => handleCancel(b.id)}
                          className="text-red-400 hover:underline"
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
