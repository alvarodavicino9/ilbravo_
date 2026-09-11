import "dotenv/config";
import express from "express";
import cors from "cors";
import cron from "node-cron";
import { businessRouter } from "./routes/business.js";
import { servicesRouter } from "./routes/services.js";
import { availabilityRouter } from "./routes/availability.js";
import { bookingsRouter } from "./routes/bookings.js";
import { fullSyncToSheet, isSheetsConfigured } from "./sheets.js";
import "./db.js"; // asegura que la DB/tablas existan al bootear

const app = express();
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, sheetsConfigured: isSheetsConfigured() });
});

app.use("/api/business", businessRouter);
app.use("/api/services", servicesRouter);
app.use("/api/availability", availabilityRouter);
app.use("/api/bookings", bookingsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`[api] IL BRAVO API escuchando en http://localhost:${PORT}`);
  console.log(`[api] Google Sheets sync: ${isSheetsConfigured() ? "ACTIVADO" : "desactivado (falta config)"}`);
});

// Resincronización periódica con Google Sheets cada 5 minutos, por las
// dudas de que alguna sincronización puntual haya fallado (ej. caída de red).
if (isSheetsConfigured()) {
  cron.schedule("*/5 * * * *", () => {
    fullSyncToSheet().catch((err) => console.error("[sheets] cron sync error:", err));
  });
}
