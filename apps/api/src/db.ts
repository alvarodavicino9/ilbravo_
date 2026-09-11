import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import servicesSeed from "./data/services.json" with { type: "json" };

// Usamos el módulo SQLite incorporado de Node (node:sqlite, disponible
// desde Node 22.5+) en vez de una librería nativa como better-sqlite3.
// Así evitamos que la instalación dependa de compilar módulos nativos
// (node-gyp / Visual Studio en Windows), que es justo lo que rompía el
// `npm install` en máquinas sin esas herramientas.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "..", "data");
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, "il-bravo.sqlite3");

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL");
db.exec("PRAGMA foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_ars INTEGER NOT NULL,
    duration_minutes INTEGER NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES services(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    date TEXT NOT NULL,        -- YYYY-MM-DD
    start_time TEXT NOT NULL,  -- HH:MM
    end_time TEXT NOT NULL,    -- HH:MM
    status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
    source TEXT NOT NULL DEFAULT 'web',       -- web | whatsapp | admin
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    sheet_synced_at TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
`);

// Seed / sync de la tabla services desde data/services.json (fuente de
// verdad de precios/servicios por ahora), dentro de una transacción manual.
const upsertService = db.prepare(`
  INSERT INTO services (id, name, price_ars, duration_minutes, active)
  VALUES (@id, @name, @priceArs, @durationMinutes, @active)
  ON CONFLICT(id) DO UPDATE SET
    name = excluded.name,
    price_ars = excluded.price_ars,
    duration_minutes = excluded.duration_minutes,
    active = excluded.active
`);

db.exec("BEGIN");
try {
  for (const s of servicesSeed as typeof servicesSeed) {
    upsertService.run({
      id: s.id,
      name: s.name,
      priceArs: s.priceArs,
      durationMinutes: s.durationMinutes,
      active: s.active ? 1 : 0,
    });
  }
  db.exec("COMMIT");
} catch (err) {
  db.exec("ROLLBACK");
  throw err;
}

export default db;
