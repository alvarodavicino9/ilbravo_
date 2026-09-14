import { supabase } from "./supabase";

export interface Service {
  id: string;
  name: string;
  priceArs: number;
  durationMinutes: number;
}

export interface DayHours {
  day: number;
  dayName: string;
  hours: { open: string; close: string } | null;
}

export interface BusinessInfo {
  name: string;
  fullName: string;
  category: string;
  address: string;
  addressShort: string;
  mapsUrl: string;
  phoneDisplay: string;
  whatsappNumber: string;
  instagram: string;
  instagramHandle: string;
  hours: DayHours[];
}

export interface AvailabilityResponse {
  date: string;
  open: boolean;
  hours: { open: string; close: string } | null;
  slots: string[];
}

export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "mercado_pago";

export interface CreateBookingInput {
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  source: "web";
  paymentMethod?: PaymentMethod | null;
}

export interface BookingResult {
  id: string;
  serviceId: string;
  serviceName: string;
  priceArs: number;
  date: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  status: string;
  paymentMethod: PaymentMethod | null;
}

export interface AdminBooking {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  serviceName: string;
  priceArs: number;
  customerName: string;
  customerPhone: string;
  status: "confirmed" | "cancelled";
  source: string;
  createdAt: string;
  paymentMethod: PaymentMethod | null;
  notes: string | null;
}

export interface AdminCreateBookingInput {
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  paymentMethod?: PaymentMethod | null;
  notes?: string | null;
}

class ApiError extends Error {}

const WEEKDAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const SLOT_STEP_MINUTES = 15;

/** Mensajes amigables para las excepciones que levantan las funciones
 * RPC en Postgres (ver migración initial_schema en Supabase). */
const RPC_ERROR_MESSAGES: Record<string, string> = {
  SERVICE_NOT_FOUND: "Servicio no encontrado",
  PAST_TIME: "Ese horario ya pasó",
  SLOT_TAKEN: "Ese horario ya no está disponible, elegí otro",
  INVALID_NAME: "El nombre ingresado no es válido",
  INVALID_PHONE: "El teléfono ingresado no es válido",
  INVALID_PAYMENT_METHOD: "Medio de pago no válido",
  UNAUTHORIZED: "No autorizado",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  mercado_pago: "Mercado Pago",
};

function friendlyRpcError(err: { message?: string } | null): ApiError {
  const raw = err?.message || "";
  for (const code of Object.keys(RPC_ERROR_MESSAGES)) {
    if (raw.includes(code)) return new ApiError(RPC_ERROR_MESSAGES[code]);
  }
  return new ApiError(raw || "Error inesperado");
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function toHHMM(mins: number): string {
  const h = Math.floor(mins / 60).toString().padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

/** Parsea "YYYY-MM-DD" como fecha local (evita corrimientos por UTC). */
function parseDateLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isPast(dateStr: string, timeStr?: string): boolean {
  const now = new Date();
  const d = parseDateLocal(dateStr);
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d.getTime() < now.getTime();
  }
  d.setHours(23, 59, 59, 999);
  return d.getTime() < now.getTime();
}

// Recorta "HH:MM:SS" (formato time de Postgres) a "HH:MM".
function hhmmss(t: string): string {
  return t.slice(0, 5);
}

export const api = {
  getBusiness: async (): Promise<BusinessInfo> => {
    const [{ data: info, error: infoErr }, { data: hoursRows, error: hoursErr }] = await Promise.all([
      supabase.from("business_info").select("*").eq("id", true).single(),
      supabase.from("business_hours").select("*").order("weekday", { ascending: true }),
    ]);
    if (infoErr) throw new ApiError(infoErr.message);
    if (hoursErr) throw new ApiError(hoursErr.message);

    const hours: DayHours[] = (hoursRows ?? []).map((h) => ({
      day: h.weekday,
      dayName: WEEKDAY_NAMES[h.weekday],
      hours: h.open_time && h.close_time ? { open: hhmmss(h.open_time), close: hhmmss(h.close_time) } : null,
    }));

    return {
      name: info.name,
      fullName: info.full_name,
      category: info.category,
      address: info.address,
      addressShort: info.address_short,
      mapsUrl: info.maps_url,
      phoneDisplay: info.phone_display,
      whatsappNumber: info.whatsapp_number,
      instagram: info.instagram,
      instagramHandle: info.instagram_handle,
      hours,
    };
  },

  getServices: async (): Promise<Service[]> => {
    const { data, error } = await supabase
      .from("services")
      .select("id, name, price_ars, duration_minutes")
      .eq("active", true)
      .order("name", { ascending: true });
    if (error) throw new ApiError(error.message);
    return (data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      priceArs: s.price_ars,
      durationMinutes: s.duration_minutes,
    }));
  },

  getAvailability: async (date: string, serviceId: string): Promise<AvailabilityResponse> => {
    const [{ data: hourRow, error: hourErr }, { data: service, error: serviceErr }] = await Promise.all([
      supabase
        .from("business_hours")
        .select("open_time, close_time")
        .eq("weekday", parseDateLocal(date).getDay())
        .maybeSingle(),
      supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .eq("active", true)
        .maybeSingle(),
    ]);
    if (hourErr) throw new ApiError(hourErr.message);
    if (serviceErr) throw new ApiError(serviceErr.message);

    const dayHours =
      hourRow?.open_time && hourRow?.close_time
        ? { open: hhmmss(hourRow.open_time), close: hhmmss(hourRow.close_time) }
        : null;

    if (!dayHours || !service) {
      return { date, open: Boolean(dayHours), hours: dayHours, slots: [] };
    }

    const { data: busyRows, error: busyErr } = await supabase.rpc("get_busy_ranges", { p_date: date });
    if (busyErr) throw new ApiError(busyErr.message);

    const busyRanges: { start: number; end: number }[] = (busyRows ?? []).map(
      (b: { start_time: string; end_time: string }) => ({
        start: toMinutes(hhmmss(b.start_time)),
        end: toMinutes(hhmmss(b.end_time)),
      })
    );

    const openMin = toMinutes(dayHours.open);
    const closeMin = toMinutes(dayHours.close);
    const duration = service.duration_minutes;

    const slots: string[] = [];
    for (let start = openMin; start + duration <= closeMin; start += SLOT_STEP_MINUTES) {
      const end = start + duration;
      const overlaps = busyRanges.some((b) => start < b.end && end > b.start);
      if (overlaps) continue;
      const hhmm = toHHMM(start);
      if (isPast(date, hhmm)) continue;
      slots.push(hhmm);
    }

    return { date, open: true, hours: dayHours, slots };
  },

  createBooking: async (input: CreateBookingInput): Promise<BookingResult> => {
    const { data, error } = await supabase
      .rpc("create_booking", {
        p_service_id: input.serviceId,
        p_date: input.date,
        p_start_time: input.startTime,
        p_customer_name: input.customerName,
        p_customer_phone: input.customerPhone,
        p_source: input.source,
        p_notes: null,
        p_payment_method: input.paymentMethod ?? null,
      })
      .single();
    if (error) throw friendlyRpcError(error);

    const row = data as {
      id: string;
      service_id: string;
      service_name: string;
      price_ars: number;
      date: string;
      start_time: string;
      end_time: string;
      customer_name: string;
      customer_phone: string;
      status: string;
      payment_method: PaymentMethod | null;
    };

    return {
      id: row.id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      priceArs: row.price_ars,
      date: row.date,
      startTime: hhmmss(row.start_time),
      endTime: hhmmss(row.end_time),
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status,
      paymentMethod: row.payment_method,
    };
  },

  adminListBookings: async (token: string, params?: { from?: string; to?: string }): Promise<AdminBooking[]> => {
    const { data, error } = await supabase.rpc("admin_list_bookings", {
      p_token: token,
      p_from: params?.from ?? null,
      p_to: params?.to ?? null,
    });
    if (error) throw friendlyRpcError(error);

    return (data ?? []).map(
      (r: {
        id: string;
        date: string;
        start_time: string;
        end_time: string;
        service_name: string;
        price_ars: number;
        customer_name: string;
        customer_phone: string;
        status: "confirmed" | "cancelled";
        source: string;
        created_at: string;
        payment_method: PaymentMethod | null;
        notes: string | null;
      }) => ({
        id: r.id,
        date: r.date,
        startTime: hhmmss(r.start_time),
        endTime: hhmmss(r.end_time),
        serviceName: r.service_name,
        priceArs: r.price_ars,
        customerName: r.customer_name,
        customerPhone: r.customer_phone,
        status: r.status,
        source: r.source,
        createdAt: r.created_at,
        paymentMethod: r.payment_method,
        notes: r.notes,
      })
    );
  },

  adminCancelBooking: async (token: string, id: string): Promise<{ ok: boolean }> => {
    const { data, error } = await supabase.rpc("admin_cancel_booking", { p_token: token, p_id: id });
    if (error) throw friendlyRpcError(error);
    return { ok: Boolean(data) };
  },

  /** Marca o corrige el medio de pago (y opcionalmente las notas) de un turno ya cargado. */
  adminUpdateBooking: async (
    token: string,
    id: string,
    changes: { paymentMethod?: PaymentMethod | null; notes?: string | null }
  ): Promise<{ ok: boolean }> => {
    const { data, error } = await supabase.rpc("admin_update_booking", {
      p_token: token,
      p_id: id,
      p_payment_method: changes.paymentMethod ?? null,
      p_notes: changes.notes ?? null,
      p_clear_payment_method: changes.paymentMethod === null,
    });
    if (error) throw friendlyRpcError(error);
    return { ok: Boolean(data) };
  },

  /** Carga un turno manual (llamada telefónica, cliente que se presenta en el local, etc). */
  adminCreateBooking: async (token: string, input: AdminCreateBookingInput): Promise<BookingResult> => {
    const { data, error } = await supabase
      .rpc("admin_create_booking", {
        p_token: token,
        p_service_id: input.serviceId,
        p_date: input.date,
        p_start_time: input.startTime,
        p_customer_name: input.customerName,
        p_customer_phone: input.customerPhone,
        p_payment_method: input.paymentMethod ?? null,
        p_notes: input.notes ?? null,
      })
      .single();
    if (error) throw friendlyRpcError(error);

    const row = data as {
      id: string;
      service_id: string;
      service_name: string;
      price_ars: number;
      date: string;
      start_time: string;
      end_time: string;
      customer_name: string;
      customer_phone: string;
      status: string;
      payment_method: PaymentMethod | null;
    };

    return {
      id: row.id,
      serviceId: row.service_id,
      serviceName: row.service_name,
      priceArs: row.price_ars,
      date: row.date,
      startTime: hhmmss(row.start_time),
      endTime: hhmmss(row.end_time),
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      status: row.status,
      paymentMethod: row.payment_method,
    };
  },

  adminExportExcel: async (token: string): Promise<Blob> => {
    const rows = await api.adminListBookings(token);
    const ExcelJS = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IL BRAVO - Sistema de turnos";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Agenda");
    sheet.columns = [
      { header: "Fecha", key: "date", width: 12 },
      { header: "Hora inicio", key: "startTime", width: 12 },
      { header: "Hora fin", key: "endTime", width: 12 },
      { header: "Servicio", key: "serviceName", width: 22 },
      { header: "Precio (ARS)", key: "priceArs", width: 14 },
      { header: "Cliente", key: "customerName", width: 24 },
      { header: "Teléfono", key: "customerPhone", width: 16 },
      { header: "Estado", key: "status", width: 14 },
      { header: "Medio de pago", key: "paymentMethod", width: 16 },
      { header: "Notas", key: "notes", width: 28 },
      { header: "Origen", key: "source", width: 12 },
      { header: "Creado", key: "createdAt", width: 20 },
    ];
    sheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF111111" } };
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    for (const r of rows) {
      sheet.addRow({
        ...r,
        status: r.status === "cancelled" ? "Cancelado" : "Confirmado",
        paymentMethod: r.paymentMethod ? PAYMENT_METHOD_LABELS[r.paymentMethod] : "",
        notes: r.notes ?? "",
      });
    }
    sheet.autoFilter = { from: "A1", to: "L1" };

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  },
};

export { ApiError };
