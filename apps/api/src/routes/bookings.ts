import { Router } from "express";
import { nanoid } from "nanoid";
import { z } from "zod";
import db from "../db.js";
import { computeEndTime, isPast, isSlotAvailable } from "../availability.js";
import { adminAuth } from "../middleware/adminAuth.js";
import { fullSyncToSheet } from "../sheets.js";
import { buildBookingsWorkbook } from "../excelExport.js";

export const bookingsRouter = Router();

const createSchema = z.object({
  serviceId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  customerName: z.string().trim().min(2, "Nombre muy corto").max(100),
  customerPhone: z.string().trim().min(6, "Teléfono inválido").max(30),
  source: z.enum(["web", "whatsapp", "admin"]).default("web"),
  notes: z.string().max(300).optional(),
});

interface ServiceRow {
  id: string;
  name: string;
  duration_minutes: number;
  price_ars: number;
}

async function syncSheetInBackground() {
  try {
    await fullSyncToSheet();
  } catch (err) {
    console.error("[sheets] error sincronizando:", err);
  }
}

// Crear turno (usado por la web y por el bot de WhatsApp)
bookingsRouter.post("/", (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" });
  }
  const { serviceId, date, startTime, customerName, customerPhone, source, notes } = parsed.data;

  const service = db
    .prepare(`SELECT id, name, duration_minutes, price_ars FROM services WHERE id = ? AND active = 1`)
    .get(serviceId) as unknown as ServiceRow | undefined;
  if (!service) {
    return res.status(404).json({ error: "Servicio no encontrado" });
  }

  if (isPast(date, startTime)) {
    return res.status(400).json({ error: "Ese horario ya pasó" });
  }

  if (!isSlotAvailable(date, serviceId, startTime)) {
    return res.status(409).json({ error: "Ese horario ya no está disponible, elegí otro" });
  }

  const endTime = computeEndTime(startTime, service.duration_minutes);
  const id = nanoid(10);

  db.prepare(
    `INSERT INTO bookings (id, service_id, customer_name, customer_phone, date, start_time, end_time, status, source, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'confirmed', ?, ?)`
  ).run(id, serviceId, customerName, customerPhone, date, startTime, endTime, source, notes ?? null);

  void syncSheetInBackground();

  res.status(201).json({
    id,
    serviceId,
    serviceName: service.name,
    priceArs: service.price_ars,
    date,
    startTime,
    endTime,
    customerName,
    customerPhone,
    status: "confirmed",
  });
});

// Listado (admin)
bookingsRouter.get("/", adminAuth, (req, res) => {
  const { from, to } = req.query as { from?: string; to?: string };

  let query = `
    SELECT b.id, b.date, b.start_time as startTime, b.end_time as endTime,
           s.name as serviceName, s.price_ars as priceArs,
           b.customer_name as customerName, b.customer_phone as customerPhone,
           b.status, b.source, b.created_at as createdAt
    FROM bookings b JOIN services s ON s.id = b.service_id
    WHERE 1 = 1
  `;
  const params: string[] = [];
  if (from) {
    query += " AND b.date >= ?";
    params.push(from);
  }
  if (to) {
    query += " AND b.date <= ?";
    params.push(to);
  }
  query += " ORDER BY b.date ASC, b.start_time ASC";

  const rows = db.prepare(query).all(...params);
  res.json(rows);
});

// Cancelar (admin)
bookingsRouter.delete("/:id", adminAuth, (req, res) => {
  const { id } = req.params;
  const existing = db.prepare(`SELECT id FROM bookings WHERE id = ?`).get(id);
  if (!existing) return res.status(404).json({ error: "Turno no encontrado" });

  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(id);
  void syncSheetInBackground();

  res.json({ ok: true });
});

// Turnos futuros de un teléfono (para que el bot de WhatsApp pueda
// listarle al cliente sus propios turnos y ofrecer cancelarlos).
bookingsRouter.get("/by-phone/:phone", (req, res) => {
  const phone = req.params.phone.replace(/\D/g, "");
  const today = new Date().toISOString().slice(0, 10);

  const rows = db
    .prepare(
      `SELECT b.id, b.date, b.start_time as startTime, s.name as serviceName
       FROM bookings b JOIN services s ON s.id = b.service_id
       WHERE b.status = 'confirmed' AND b.date >= ?
       ORDER BY b.date ASC, b.start_time ASC`
    )
    .all(today) as unknown as { id: string; date: string; startTime: string; serviceName: string; phone?: string }[];

  // Filtramos en JS por teléfono normalizado (sin guiones/espacios) ya
  // que se guarda tal cual lo tipeó el cliente en la web.
  const allWithPhone = db
    .prepare(`SELECT id, customer_phone as phone FROM bookings WHERE status = 'confirmed'`)
    .all() as unknown as { id: string; phone: string }[];
  const matchIds = new Set(
    allWithPhone.filter((b) => b.phone.replace(/\D/g, "").endsWith(phone.slice(-8))).map((b) => b.id)
  );

  res.json(rows.filter((r) => matchIds.has(r.id)));
});

// Cancelar por WhatsApp (identificando por teléfono, sin token admin)
bookingsRouter.post("/:id/cancel-by-phone", (req, res) => {
  const { id } = req.params;
  const { phone } = req.body as { phone?: string };
  if (!phone) return res.status(400).json({ error: "Falta el teléfono" });

  const booking = db
    .prepare(`SELECT id, customer_phone as phone FROM bookings WHERE id = ?`)
    .get(id) as unknown as { id: string; phone: string } | undefined;

  if (!booking || booking.phone.replace(/\D/g, "") !== phone.replace(/\D/g, "")) {
    return res.status(404).json({ error: "Turno no encontrado para ese teléfono" });
  }

  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE id = ?`).run(id);
  void syncSheetInBackground();
  res.json({ ok: true });
});

// Exportar a Excel real (admin)
bookingsRouter.get("/export/excel", adminAuth, async (_req, res) => {
  const buffer = await buildBookingsWorkbook();
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename="il-bravo-agenda.xlsx"`);
  res.send(Buffer.from(buffer));
});

// Forzar re-sincronización manual con Google Sheets (admin)
bookingsRouter.post("/sync-sheet", adminAuth, async (_req, res) => {
  const result = await fullSyncToSheet();
  res.json(result);
});
