import { Router } from "express";
import { z } from "zod";
import { getAvailableSlots, getDayHours } from "../availability.js";

export const availabilityRouter = Router();

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido (YYYY-MM-DD)"),
  serviceId: z.string().min(1),
});

availabilityRouter.get("/", (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Parámetros inválidos" });
  }

  const { date, serviceId } = parsed.data;
  const dayHours = getDayHours(date);
  const slots = getAvailableSlots(date, serviceId);

  res.json({
    date,
    open: Boolean(dayHours),
    hours: dayHours,
    slots,
  });
});
