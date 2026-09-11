import { Router } from "express";
import { BUSINESS, BUSINESS_HOURS, WEEKDAY_NAMES } from "../data/business.js";

export const businessRouter = Router();

businessRouter.get("/", (_req, res) => {
  const hours = (Object.keys(BUSINESS_HOURS) as unknown as (keyof typeof BUSINESS_HOURS)[]).map(
    (day) => ({
      day: Number(day),
      dayName: WEEKDAY_NAMES[day],
      hours: BUSINESS_HOURS[day],
    })
  );

  res.json({ ...BUSINESS, hours });
});
