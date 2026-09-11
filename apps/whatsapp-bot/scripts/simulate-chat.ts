/**
 * Herramienta de desarrollo: simula una conversación completa de
 * WhatsApp (sin conectar un número real) contra la API para probar
 * el flujo de reserva. Requiere que apps/api esté corriendo.
 *
 * Uso: npm run simulate --workspace=apps/whatsapp-bot
 */
import { handleMessage } from "../src/conversation.js";

const jid = "3517654321@s.whatsapp.net";

async function run() {
  const steps = ["hola", "2", "1", "sabado", "1", "Test Simulado"];
  for (const s of steps) {
    const reply = await handleMessage(jid, s);
    console.log(`>> "${s}"\n${reply}\n---`);
  }
}

run();
