const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miercoles",
  "miércoles",
  "jueves",
  "viernes",
  "sabado",
  "sábado",
];

function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const WEEKDAY_INDEX: Record<string, number> = {
  domingo: 0,
  lunes: 1,
  martes: 2,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sabado: 6,
};

/**
 * Interpreta lo que el cliente escribió como fecha: "hoy", "mañana",
 * "sabado", "15/09", "2026-09-15", etc. Devuelve YYYY-MM-DD o null si
 * no se entendió.
 */
export function parseDateInput(raw: string): string | null {
  const text = stripAccents(raw.trim().toLowerCase());
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (text === "hoy") return toISO(now);
  if (text === "manana" || text === "mañana") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    return toISO(d);
  }

  // ISO: 2026-09-15
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return text;

  // DD/MM o DD-MM (asume año actual, o el próximo si ya pasó)
  const dmMatch = text.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?$/);
  if (dmMatch) {
    const day = Number(dmMatch[1]);
    const month = Number(dmMatch[2]);
    let year = dmMatch[3] ? Number(dmMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    let candidate = new Date(year, month - 1, day);
    if (!dmMatch[3] && candidate.getTime() < now.getTime()) {
      candidate = new Date(year + 1, month - 1, day);
    }
    if (candidate.getMonth() !== month - 1) return null; // fecha inválida (ej 31/02)
    return toISO(candidate);
  }

  // Nombre de día: "sabado", "el viernes", etc -> próxima ocurrencia
  for (const name of Object.keys(WEEKDAY_INDEX)) {
    if (text.includes(name)) {
      const target = WEEKDAY_INDEX[name];
      const d = new Date(now);
      let diff = (target - d.getDay() + 7) % 7;
      if (diff === 0) diff = 7; // si dice "sabado" y hoy es sabado, asume el próximo
      d.setDate(d.getDate() + diff);
      return toISO(d);
    }
  }

  return null;
}

export function formatDateHuman(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dayName = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ][date.getDay()];
  return `${dayName} ${pad(d)}/${pad(m)}`;
}

export function normalizePhone(jid: string): string {
  // jid típico: "5493516609971@s.whatsapp.net"
  return jid.split("@")[0].replace(/\D/g, "");
}
