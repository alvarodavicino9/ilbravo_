import type { BusinessInfo, Service } from "./api.js";

export function mainMenuText(business: BusinessInfo): string {
  return `¡Hola! 💈 Soy el asistente virtual de *${business.name}*.

Elegí una opción escribiendo el número o la palabra:

*1* — Horarios de atención
*2* — Reservar un turno
*3* — Precios
*4* — Ubicación
*5* — Cancelar un turno

También podés escribirme directamente tu consulta.`;
}

export function hoursText(business: BusinessInfo): string {
  const lines = business.hours
    .map((h) => `${h.dayName}: ${h.hours ? `${h.hours.open} a ${h.hours.close} hs` : "Cerrado"}`)
    .join("\n");
  return `🕒 *Horarios de ${business.name}*\n${lines}`;
}

export function pricesText(services: Service[]): string {
  const lines = services
    .map((s) => `• ${s.name} — $${s.priceArs.toLocaleString("es-AR")} (${s.durationMinutes} min)`)
    .join("\n");
  return `💈 *Servicios y precios*\n${lines}\n\nPara reservar escribí *2* o "turno".`;
}

export function locationText(business: BusinessInfo): string {
  return `📍 *${business.name}*\n${business.addressShort}\n${business.mapsUrl}`;
}

export function servicesListForBooking(services: Service[]): string {
  const lines = services
    .map((s, i) => `${i + 1}. ${s.name} — $${s.priceArs.toLocaleString("es-AR")} (${s.durationMinutes} min)`)
    .join("\n");
  return `¿Qué servicio querés reservar? Respondé con el número:\n\n${lines}`;
}

export function unknownText(): string {
  return `No entendí tu mensaje 🤔. Escribí *menu* para ver las opciones.`;
}
