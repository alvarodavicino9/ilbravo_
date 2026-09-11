import { api, type BusinessInfo, type Service } from "./api.js";

let businessCache: BusinessInfo | null = null;
let servicesCache: Service[] | null = null;

export async function refreshCache(): Promise<void> {
  try {
    const [business, services] = await Promise.all([api.getBusiness(), api.getServices()]);
    businessCache = business;
    servicesCache = services;
  } catch (err) {
    console.error("[cache] no se pudo refrescar contra la API (¿está prendida?):", err);
  }
}

export async function getBusiness(): Promise<BusinessInfo> {
  if (!businessCache) await refreshCache();
  if (!businessCache) throw new Error("No se pudo obtener info del negocio desde la API");
  return businessCache;
}

export async function getServices(): Promise<Service[]> {
  if (!servicesCache) await refreshCache();
  if (!servicesCache) throw new Error("No se pudo obtener servicios desde la API");
  return servicesCache;
}
