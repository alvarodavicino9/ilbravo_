import { api, type Service } from "./api.js";
import { getBusiness, getServices } from "./cache.js";
import { formatDateHuman, normalizePhone, parseDateInput } from "./dateParsing.js";
import { answerFreeText, isAiEnabled } from "./ai.js";
import {
  hoursText,
  locationText,
  mainMenuText,
  pricesText,
  servicesListForBooking,
  unknownText,
} from "./menu.js";

type Step =
  | "idle"
  | "choosing_service"
  | "choosing_date"
  | "choosing_time"
  | "confirming_name"
  | "cancel_choosing";

interface CancelOption {
  id: string;
  label: string;
}

interface Session {
  step: Step;
  serviceOptions?: Service[];
  serviceId?: string;
  serviceName?: string;
  date?: string;
  slotOptions?: string[];
  startTime?: string;
  cancelOptions?: CancelOption[];
}

const sessions = new Map<string, Session>();

function getSession(jid: string): Session {
  let s = sessions.get(jid);
  if (!s) {
    s = { step: "idle" };
    sessions.set(jid, s);
  }
  return s;
}

function resetSession(jid: string) {
  sessions.set(jid, { step: "idle" });
}

function stripAccents(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function norm(s: string): string {
  return stripAccents(s.trim().toLowerCase());
}

const GREETING_WORDS = ["menu", "hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hi"];

export async function handleMessage(jid: string, rawText: string): Promise<string> {
  const text = rawText.trim();
  const lower = norm(text);
  const session = getSession(jid);

  // Comandos globales, siempre disponibles.
  if (GREETING_WORDS.includes(lower)) {
    resetSession(jid);
    return mainMenuText(await getBusiness());
  }

  if (lower === "cancelar" && session.step !== "idle" && session.step !== "cancel_choosing") {
    resetSession(jid);
    return `Listo, cancelé la operación en curso. Escribí *menu* para ver las opciones.`;
  }

  switch (session.step) {
    case "idle":
      return handleIdle(jid, lower, session);
    case "choosing_service":
      return handleChoosingService(text, session);
    case "choosing_date":
      return handleChoosingDate(text, session);
    case "choosing_time":
      return handleChoosingTime(text, session);
    case "confirming_name":
      return handleConfirmingName(jid, text, session);
    case "cancel_choosing":
      return handleCancelChoosing(jid, text, session);
    default:
      resetSession(jid);
      return mainMenuText(await getBusiness());
  }
}

async function handleIdle(jid: string, lower: string, session: Session): Promise<string> {
  if (lower === "1" || lower.includes("horario")) {
    return hoursText(await getBusiness());
  }

  if (lower === "2" || lower.includes("turno") || lower.includes("reserv")) {
    const services = await getServices();
    if (services.length === 0) {
      return "Por ahora no hay servicios disponibles para reservar online. Escribinos directo y te ayudamos 🙌";
    }
    session.step = "choosing_service";
    session.serviceOptions = services;
    return servicesListForBooking(services);
  }

  if (lower === "3" || lower.includes("precio")) {
    return pricesText(await getServices());
  }

  if (lower === "4" || lower.includes("ubicacion") || lower.includes("direccion") || lower.includes("donde")) {
    return locationText(await getBusiness());
  }

  if (lower === "5" || lower.includes("cancelar")) {
    const phone = normalizePhone(jid);
    const bookings = await api.getBookingsByPhone(phone);
    if (bookings.length === 0) {
      return "No encontré turnos activos a tu nombre 🤷. Escribí *menu* para ver las opciones.";
    }
    session.step = "cancel_choosing";
    session.cancelOptions = bookings.map((b) => ({
      id: b.id,
      label: `${formatDateHuman(b.date)} ${b.startTime} — ${b.serviceName}`,
    }));
    const list = session.cancelOptions.map((o, i) => `${i + 1}. ${o.label}`).join("\n");
    return `¿Cuál turno querés cancelar?\n\n${list}\n\n(o escribí *0* para no cancelar nada)`;
  }

  if (isAiEnabled()) {
    const [business, services] = await Promise.all([getBusiness(), getServices()]);
    const aiReply = await answerFreeText(lower, business, services);
    if (aiReply) return aiReply;
  }

  return unknownText();
}

function handleChoosingService(text: string, session: Session): string {
  const options = session.serviceOptions || [];
  const idx = Number(text.trim()) - 1;
  if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
    const chosen = options[idx];
    session.serviceId = chosen.id;
    session.serviceName = chosen.name;
    session.step = "choosing_date";
    return `Elegiste *${chosen.name}* ($${chosen.priceArs.toLocaleString("es-AR")}).\n\n¿Qué día querés venir? Escribí "hoy", "mañana", un día de la semana (ej. "sábado") o una fecha (ej. 15/09).`;
  }
  return `No entendí. Respondé con el número del servicio de la lista (o escribí *cancelar* para salir).`;
}

async function handleChoosingDate(text: string, session: Session): Promise<string> {
  const iso = parseDateInput(text);
  if (!iso) {
    return `No pude entender esa fecha. Probá con "hoy", "mañana", un día de la semana o formato DD/MM.`;
  }

  const availability = await api.getAvailability(iso, session.serviceId!);
  if (!availability.open) {
    return `Ese día está cerrado. Probá con otro día (Lunes a Sábado).`;
  }
  if (availability.slots.length === 0) {
    return `No quedan horarios libres el ${formatDateHuman(iso)} para ese servicio. Probá con otro día.`;
  }

  session.date = iso;
  session.slotOptions = availability.slots;
  session.step = "choosing_time";

  const shown = availability.slots.slice(0, 16);
  const list = shown.map((t, i) => `${i + 1}. ${t}`).join("\n");
  const extra = availability.slots.length > shown.length ? `\n...y más horarios disponibles.` : "";
  return `Horarios disponibles el ${formatDateHuman(iso)}:\n\n${list}${extra}\n\nRespondé con el número del horario que quieras.`;
}

function handleChoosingTime(text: string, session: Session): string {
  const options = session.slotOptions || [];
  const idx = Number(text.trim()) - 1;
  if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
    session.startTime = options[idx];
    session.step = "confirming_name";
    return `Perfecto, ${formatDateHuman(session.date!)} a las ${session.startTime}. ¿A nombre de quién reservo el turno?`;
  }
  return `Respondé con el número del horario de la lista (o escribí *cancelar* para salir).`;
}

async function handleConfirmingName(jid: string, text: string, session: Session): Promise<string> {
  const name = text.trim();
  if (name.length < 2) {
    return `Ese nombre no parece válido, decime tu nombre y apellido.`;
  }

  try {
    const booking = await api.createBooking({
      serviceId: session.serviceId!,
      date: session.date!,
      startTime: session.startTime!,
      customerName: name,
      customerPhone: normalizePhone(jid),
      source: "whatsapp",
    });
    resetSession(jid);
    return `✅ ¡Turno confirmado!\n\n*${booking.serviceName}*\n${formatDateHuman(booking.date)} a las ${booking.startTime} hs\nA nombre de: ${name}\n\nTe esperamos en IL BRAVO 💈. Si necesitás cancelarlo, escribí *menu* y elegí la opción 5.`;
  } catch (err) {
    resetSession(jid);
    const message = err instanceof Error ? err.message : "Error desconocido";
    return `No pude confirmar el turno (${message}). Escribí *menu* para intentar de nuevo.`;
  }
}

async function handleCancelChoosing(jid: string, text: string, session: Session): Promise<string> {
  const trimmed = text.trim();
  if (trimmed === "0") {
    resetSession(jid);
    return `Ok, no cancelé nada. Escribí *menu* para ver las opciones.`;
  }

  const options = session.cancelOptions || [];
  const idx = Number(trimmed) - 1;
  if (Number.isInteger(idx) && idx >= 0 && idx < options.length) {
    const chosen = options[idx];
    await api.cancelByPhone(chosen.id, normalizePhone(jid));
    resetSession(jid);
    return `❌ Turno cancelado: ${chosen.label}.\n\nEscribí *menu* si querés reservar otro.`;
  }

  return `Respondé con el número del turno a cancelar, o *0* para no cancelar nada.`;
}
