import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Loader2 } from "lucide-react";
import { api, type AdminBooking } from "../../lib/api";
import { formatDM, isoDaysFromNow, todayIso } from "../../lib/date";

const currency = new Intl.NumberFormat("es-AR");

type PeriodValue = "today" | "7d" | "30d";

const PERIODS: { value: PeriodValue; label: string; days: number }[] = [
  { value: "today", label: "Hoy", days: 1 },
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
];

/** Gráfico de ingresos cobrados (turnos confirmados y marcados como
 * pagados), con selector de período. Trae sus propios datos por rango de
 * fechas — independiente de la tabla principal, que solo mira turnos
 * próximos. */
export function RevenueChart({ token }: { token: string }) {
  const [period, setPeriod] = useState<PeriodValue>("7d");
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(false);

  const days = PERIODS.find((p) => p.value === period)!.days;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .adminListBookings(token, { from: isoDaysFromNow(-(days - 1)), to: todayIso() })
      .then((res) => {
        if (!cancelled) setRows(res);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, days]);

  const { bars, total, paidCount, pendingTotal } = useMemo(() => {
    const byDate = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      byDate.set(isoDaysFromNow(-(days - 1) + i), 0);
    }
    let total = 0;
    let paidCount = 0;
    let pendingTotal = 0;
    for (const b of rows) {
      if (b.status !== "confirmed") continue;
      if (b.paid) {
        byDate.set(b.date, (byDate.get(b.date) ?? 0) + b.priceArs);
        total += b.priceArs;
        paidCount += 1;
      } else {
        pendingTotal += b.priceArs;
      }
    }
    return { bars: Array.from(byDate.entries()), total, paidCount, pendingTotal };
  }, [rows, days]);

  const max = Math.max(1, ...bars.map(([, v]) => v));
  const showLabels = days <= 7;

  return (
    <div className="panel rounded-2xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-paper/50">
              Ingresos cobrados
            </p>
            <p className="font-display text-2xl tabular-nums text-paper">
              ${currency.format(total)}
              {loading && <Loader2 className="ml-2 inline h-4 w-4 animate-spin text-paper/30" />}
            </p>
          </div>
        </div>

        <div className="flex w-fit gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                period === p.value ? "bg-gold text-ink" : "text-paper/60 hover:text-paper"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {pendingTotal > 0 && (
        <p className="mt-2 text-xs text-paper/40">
          + ${currency.format(pendingTotal)} pendiente de cobro en este período
        </p>
      )}

      <div className="mt-6 flex h-32 items-end gap-1 sm:gap-1.5">
        {bars.map(([iso, value], i) => (
          <div key={iso} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.max((value / max) * 100, value > 0 ? 4 : 1.5)}%` }}
              transition={{ duration: 0.4, delay: i * 0.012, ease: "easeOut" }}
              className={`w-full rounded-t-md ${
                value > 0 ? "bg-gradient-to-t from-gold-dim to-gold" : "bg-white/[0.06]"
              }`}
            />
            <div className="pointer-events-none absolute bottom-full mb-1.5 hidden whitespace-nowrap rounded-lg bg-ink px-2 py-1 text-[11px] text-paper shadow-lg group-hover:block">
              {formatDM(iso)} · ${currency.format(value)}
            </div>
            {showLabels && <span className="text-[10px] text-paper/35">{formatDM(iso)}</span>}
          </div>
        ))}
      </div>

      {paidCount === 0 && !loading && (
        <p className="mt-4 text-center text-sm text-paper/40">Todavía no hay cobros marcados en este período.</p>
      )}
    </div>
  );
}
