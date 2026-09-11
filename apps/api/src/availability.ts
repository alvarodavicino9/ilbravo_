import db from "./db.js";
import { BUSINESS_HOURS, Weekday } from "./data/business.js";

const SLOT_STEP_MINUTES = 15; // granularidad de los turnos ofrecidos

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Parsea "YYYY-MM-DD" como fecha local (evita corrimientos por UTC). */
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function isPast(dateStr: string, timeStr?: string): boolean {
  const now = new Date();
  const d = parseDateLocal(dateStr);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.getTime() < now.getTime();
  }
  d.setHours(23, 59, 59, 999);
  return d.getTime() < now.getTime();
}

export function getDayHours(dateStr: string) {
  const weekday = parseDateLocal(dateStr).getDay() as Weekday;
  return BUSINESS_HOURS[weekday];
}

interface ServiceRow {
  id: string;
  duration_minutes: number;
}

/**
 * Devuelve los horarios de inicio disponibles (HH:MM) para un servicio
 * en una fecha dada, considerando el horario de atención del día y los
 * turnos ya confirmados (sin superposición).
 */
export function getAvailableSlots(dateStr: string, serviceId: string): string[] {
  const hours = getDayHours(dateStr);
  if (!hours) return []; // local cerrado ese día

  const service = db
    .prepare(`SELECT id, duration_minutes FROM services WHERE id = ? AND active = 1`)
    .get(serviceId) as unknown as ServiceRow | undefined;
  if (!service) return [];

  const openMin = toMinutes(hours.open);
  const closeMin = toMinutes(hours.close);
  const duration = service.duration_minutes;

  const existing = db
    .prepare(
      `SELECT start_time, end_time FROM bookings
       WHERE date = ? AND status = 'confirmed'`
    )
    .all(dateStr) as unknown as { start_time: string; end_time: string }[];

  const busyRanges = existing.map((b) => ({
    start: toMinutes(b.start_time),
    end: toMinutes(b.end_time),
  }));

  const slots: string[] = [];
  for (let start = openMin; start + duration <= closeMin; start += SLOT_STEP_MINUTES) {
    const end = start + duration;
    const overlaps = busyRanges.some((b) => start < b.end && end > b.start);
    if (overlaps) continue;

    const hhmm = toHHMM(start);
    if (isPast(dateStr, hhmm)) continue;

    slots.push(hhmm);
  }

  return slots;
}

export function computeEndTime(startTime: string, durationMinutes: number): string {
  return toHHMM(toMinutes(startTime) + durationMinutes);
}

export function isSlotAvailable(dateStr: string, serviceId: string, startTime: string): boolean {
  return getAvailableSlots(dateStr, serviceId).includes(startTime);
}
