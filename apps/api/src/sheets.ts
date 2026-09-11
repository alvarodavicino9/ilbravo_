/**
 * Sincronización en vivo de la agenda hacia Google Sheets.
 *
 * Se activa SOLO si están configuradas estas variables de entorno:
 *   GOOGLE_SERVICE_ACCOUNT_EMAIL
 *   GOOGLE_PRIVATE_KEY
 *   GOOGLE_SHEET_ID
 *
 * Si no están configuradas, el resto del sistema sigue funcionando
 * normal (la base SQLite es la fuente de verdad); simplemente no hay
 * espejo en Sheets todavía. Ver README para el paso a paso de cómo
 * crear la cuenta de servicio y compartir la planilla.
 */
import { google } from "googleapis";
import db from "./db.js";

const SHEET_NAME = "Agenda";
const HEADER = [
  "ID",
  "Fecha",
  "Hora inicio",
  "Hora fin",
  "Servicio",
  "Cliente",
  "Teléfono",
  "Estado",
  "Origen",
  "Creado",
];

function isConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      process.env.GOOGLE_SHEET_ID
  );
}

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getClient() {
  if (!isConfigured()) return null;
  if (sheetsClient) return sheetsClient;

  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // En .env la clave viene con \n escapados, hay que restaurarlos.
    key: (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  sheetsClient = google.sheets({ version: "v4", auth });
  return sheetsClient;
}

async function ensureHeader() {
  const sheets = getClient();
  if (!sheets) return;
  const sheetId = process.env.GOOGLE_SHEET_ID!;
  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A1:J1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADER] },
  });
}

interface BookingRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  service_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  source: string;
  created_at: string;
}

/**
 * Reescribe la planilla completa con el estado actual de la base.
 * Es la forma más simple de mantenerla "siempre actualizada" sin
 * lidiar con sincronización bidireccional / conflictos de edición.
 * Se llama después de cada alta/baja y también por cron (ver index.ts).
 */
export async function fullSyncToSheet(): Promise<{ synced: boolean; rows?: number }> {
  const sheets = getClient();
  if (!sheets) return { synced: false };

  await ensureHeader();

  const rows = db
    .prepare(
      `SELECT b.id, b.date, b.start_time, b.end_time, s.name as service_id,
              b.customer_name, b.customer_phone, b.status, b.source, b.created_at
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       ORDER BY b.date ASC, b.start_time ASC`
    )
    .all() as unknown as BookingRow[];

  const values = rows.map((r) => [
    r.id,
    r.date,
    r.start_time,
    r.end_time,
    r.service_id,
    r.customer_name,
    r.customer_phone,
    r.status === "cancelled" ? "Cancelado" : "Confirmado",
    r.source,
    r.created_at,
  ]);

  const sheetId = process.env.GOOGLE_SHEET_ID!;
  // Limpia el rango de datos (deja el header) y escribe todo de nuevo.
  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: `${SHEET_NAME}!A2:J100000`,
  });

  if (values.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${SHEET_NAME}!A2`,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    db.prepare(`UPDATE bookings SET sheet_synced_at = datetime('now')`).run();
  }

  return { synced: true, rows: values.length };
}

export function isSheetsConfigured(): boolean {
  return isConfigured();
}
