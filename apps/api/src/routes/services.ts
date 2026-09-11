import { Router } from "express";
import db from "../db.js";

export const servicesRouter = Router();

servicesRouter.get("/", (_req, res) => {
  const services = db
    .prepare(
      `SELECT id, name, price_ars as priceArs, duration_minutes as durationMinutes
       FROM services WHERE active = 1 ORDER BY name ASC`
    )
    .all();
  res.json(services);
});
