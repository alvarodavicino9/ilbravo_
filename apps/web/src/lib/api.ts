const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

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

export interface CreateBookingInput {
  serviceId: string;
  date: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  source: "web";
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
}

class ApiError extends Error {}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError((body as any).error || `Error ${res.status}`);
  }
  return body as T;
}

export const api = {
  getBusiness: () => jsonFetch<BusinessInfo>("/api/business"),
  getServices: () => jsonFetch<Service[]>("/api/services"),
  getAvailability: (date: string, serviceId: string) =>
    jsonFetch<AvailabilityResponse>(
      `/api/availability?date=${encodeURIComponent(date)}&serviceId=${encodeURIComponent(serviceId)}`
    ),
  createBooking: (input: CreateBookingInput) =>
    jsonFetch<BookingResult>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  adminListBookings: (token: string, params?: { from?: string; to?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return jsonFetch<AdminBooking[]>(`/api/bookings${qs ? `?${qs}` : ""}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  adminCancelBooking: (token: string, id: string) =>
    jsonFetch<{ ok: boolean }>(`/api/bookings/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),
  adminExportExcel: async (token: string): Promise<Blob> => {
    const res = await fetch(`${API_URL}/api/bookings/export/excel`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new ApiError("No se pudo exportar el Excel");
    return res.blob();
  },
  adminSyncSheet: (token: string) =>
    jsonFetch<{ synced: boolean; rows?: number }>("/api/bookings/sync-sheet", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export { ApiError };
