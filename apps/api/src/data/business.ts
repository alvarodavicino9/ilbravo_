/**
 * Datos reales del negocio (extraídos de Instagram @ilbravo.peluqueria
 * y del perfil de WhatsApp Business el 11/09/2026).
 *
 * Si algo cambia (horarios, dirección, etc.) se edita SOLO acá y se
 * propaga automáticamente a la web, la API y el bot de WhatsApp.
 */

export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = domingo ... 6 = sábado

export interface DayHours {
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export const BUSINESS = {
  name: "IL BRAVO",
  fullName: "IL BRAVO | Peluquería & Barbería",
  category: "Peluquería, Barbería y cuidado personal",
  address: "Miguel Calixto del Corro 173, X5000KTC Córdoba, Argentina",
  addressShort: "Miguel C. del Corro 173, Zona Centro, Córdoba",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=Miguel+Calixto+del+Corro+173+Cordoba+Argentina",
  phoneDisplay: "+54 9 3516 60-9971",
  // Formato E.164 sin "+" para WhatsApp / wa.me
  whatsappNumber: "5493516609971",
  instagram: "https://www.instagram.com/ilbravo.peluqueria",
  instagramHandle: "@ilbravo.peluqueria",
  timezone: "America/Argentina/Cordoba",
  currency: "ARS",
};

/**
 * Horarios reales tomados del perfil de WhatsApp Business.
 * NOTA: el viernes no se veía en la captura (se cortaba en jueves),
 * así que se asumió el mismo horario que martes/miércoles/jueves/sábado
 * (10:30 a 20:00). Confirmar con el cliente y ajustar si hace falta,
 * es la única línea a tocar.
 */
export const BUSINESS_HOURS: Record<Weekday, DayHours | null> = {
  0: null, // domingo: cerrado
  1: { open: "11:00", close: "20:00" }, // lunes
  2: { open: "10:30", close: "20:00" }, // martes
  3: { open: "10:30", close: "20:00" }, // miércoles
  4: { open: "10:30", close: "20:00" }, // jueves
  5: { open: "10:30", close: "20:00" }, // viernes (asumido, confirmar)
  6: { open: "10:30", close: "20:00" }, // sábado
};

export const WEEKDAY_NAMES: Record<Weekday, string> = {
  0: "Domingo",
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
};
