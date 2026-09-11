import "dotenv/config";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import qrcode from "qrcode-terminal";
import pino from "pino";
import { handleMessage } from "./conversation.js";
import { refreshCache } from "./cache.js";

const logger = pino({ level: "silent" }); // Baileys es MUY verboso; lo silenciamos.

function extractText(msg: any): string | null {
  const m = msg.message;
  if (!m) return null;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    null
  );
}

async function start() {
  const { state, saveCreds } = await useMultiFileAuthState("auth");
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log("\n[whatsapp-bot] Escaneá este código QR con el WhatsApp del local (WhatsApp > Dispositivos vinculados > Vincular un dispositivo):\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
      const loggedOut = statusCode === DisconnectReason.loggedOut;
      console.log(`[whatsapp-bot] Conexión cerrada (código ${statusCode}). ${loggedOut ? "Sesión cerrada, borrá la carpeta auth/ y volvé a escanear el QR." : "Reintentando..."}`);
      if (!loggedOut) start();
    } else if (connection === "open") {
      console.log("[whatsapp-bot] ✅ Conectado a WhatsApp. El asistente de IL BRAVO está activo.");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      try {
        if (!msg.message || msg.key.fromMe) continue;
        const jid = msg.key.remoteJid;
        if (!jid || jid.endsWith("@g.us") || jid === "status@broadcast") continue; // ignora grupos y estados

        const text = extractText(msg);
        if (!text) continue;

        await sock.readMessages([msg.key]);
        await sock.sendPresenceUpdate("composing", jid);

        const reply = await handleMessage(jid, text);

        await sock.sendMessage(jid, { text: reply });
        await sock.sendPresenceUpdate("paused", jid);
      } catch (err) {
        console.error("[whatsapp-bot] error procesando mensaje:", err);
      }
    }
  });
}

refreshCache();
setInterval(refreshCache, 10 * 60 * 1000); // refresca servicios/horarios cada 10 min

start().catch((err) => {
  console.error("[whatsapp-bot] error fatal al iniciar:", err);
  process.exit(1);
});
