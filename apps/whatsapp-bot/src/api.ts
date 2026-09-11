const API_URL = process.env.API_URL || "http://localhost:4000";

export interface Service {
  id: string;
  name: string;
  priceArs: number;
  durationMinutes: number;
}

export interface BusinessInfo {
  name: string;
  fullName: string;
  addressShort: string;
  mapsUrl: string;
  phoneDisplay: string;
  instagram: string;
  hours: { day: number; dayName: string; hours: { open: string; close: string } | null }[];
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
  source: "whatsapp";
}

export interface CreateBookingResult {
  id: string;
  serviceName: string;
  priceArs: number;
  date: string;
  startTime: string;
  endTime: string;
}

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as any).error || `Error ${res.status}`);
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
    jsonFetch<CreateBookingResult>("/api/bookings", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getBookingsByPhone: (phone: string) =>
    jsonFetch<{ id: string; date: string; startTime: string; serviceName: string }[]>(
      `/api/bookings/by-phone/${encodeURIComponent(phone)}`
    ),
  cancelByPhone: (id: string, phone: string) =>
    jsonFetch<{ ok: boolean }>(`/api/bookings/${encodeURIComponent(id)}/cancel-by-phone`, {
      method: "POST",
      body: JSON.stringify({ phone }),
    }),
};
