/**
 * Exportación manual a .xlsx (Excel real). Sirve como respaldo /
 * complemento del espejo en Google Sheets: siempre se puede bajar
 * un Excel actualizado al toque, aunque Google Sheets no esté
 * configurado todavía.
 */
import ExcelJS from "exceljs";
import db from "./db.js";

interface BookingRow {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  service_name: string;
  price_ars: number;
  customer_name: string;
  customer_phone: string;
  status: string;
  source: string;
  created_at: string;
}

export async function buildBookingsWorkbook(): Promise<ExcelJS.Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "IL BRAVO - Sistema de turnos";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Agenda");
  sheet.columns = [
    { header: "Fecha", key: "date", width: 12 },
    { header: "Hora inicio", key: "start_time", width: 12 },
    { header: "Hora fin", key: "end_time", width: 12 },
    { header: "Servicio", key: "service_name", width: 22 },
    { header: "Precio (ARS)", key: "price_ars", width: 14 },
    { header: "Cliente", key: "customer_name", width: 24 },
    { header: "Teléfono", key: "customer_phone", width: 16 },
    { header: "Estado", key: "status", width: 14 },
    { header: "Origen", key: "source", width: 12 },
    { header: "Creado", key: "created_at", width: 20 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF111111" },
  };
  sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

  const rows = db
    .prepare(
      `SELECT b.id, b.date, b.start_time, b.end_time, s.name as service_name,
              s.price_ars, b.customer_name, b.customer_phone, b.status,
              b.source, b.created_at
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       ORDER BY b.date ASC, b.start_time ASC`
    )
    .all() as unknown as BookingRow[];

  for (const r of rows) {
    sheet.addRow({
      ...r,
      status: r.status === "cancelled" ? "Cancelado" : "Confirmado",
    });
  }

  sheet.autoFilter = { from: "A1", to: "J1" };

  return workbook.xlsx.writeBuffer();
}
