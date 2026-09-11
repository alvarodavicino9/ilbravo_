import Anthropic from "@anthropic-ai/sdk";
import type { BusinessInfo, Service } from "./api.js";

let client: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export function isAiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Respuesta con IA para mensajes libres que no matchean ningún
 * comando del menú. Está atada estrictamente a los datos reales del
 * negocio (se le pasan como contexto) para que no invente precios,
 * horarios ni servicios que no existen.
 */
export async function answerFreeText(
  userMessage: string,
  business: BusinessInfo,
  services: Service[]
): Promise<string | null> {
  const anthropic = getClient();
  if (!anthropic) return null;

  const hoursText = business.hours
    .map((h) => `${h.dayName}: ${h.hours ? `${h.hours.open} a ${h.hours.close}` : "cerrado"}`)
    .join("\n");
  const servicesText = services
    .map((s) => `- ${s.name}: $${s.priceArs} (${s.durationMinutes} min)`)
    .join("\n");

  const system = `Sos el asistente virtual de WhatsApp de "${business.fullName}", una peluquería y barbería en Córdoba, Argentina.
Respondé SIEMPRE en español rioplatense, corto y directo (máximo 3-4 líneas), como un mensaje de WhatsApp real.
Usá SOLO esta información real del negocio, nunca inventes datos que no están acá:

Dirección: ${business.addressShort}
Teléfono/WhatsApp: ${business.phoneDisplay}
Instagram: ${business.instagram}
Horarios:
${hoursText}

Servicios y precios:
${servicesText}

Si el cliente quiere reservar, cancelar o ver horarios disponibles para un turno puntual, indicale que escriba la palabra "turno" (para reservar) o "cancelar" (para cancelar uno existente) para arrancar ese proceso paso a paso vos NO tenés que inventar ni confirmar turnos en este mensaje.
Si preguntan algo que no tiene que ver con la peluquería, respondé amablemente que no podés ayudar con eso y ofrecé el menú (escribiendo "menu").`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 300,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock && "text" in textBlock ? textBlock.text.trim() : null;
  } catch (err) {
    console.error("[ai] error consultando Claude:", err);
    return null;
  }
}
