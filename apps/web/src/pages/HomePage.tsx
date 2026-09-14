import { lazy, Suspense, useEffect, useState } from "react";
import { api, type BusinessInfo, type Service } from "../lib/api";
import { BackgroundFX } from "../components/BackgroundFX";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";

// Todo lo que va debajo del Hero se pide aparte: el navegador puede
// dibujar el Header + Hero (lo único que hace falta para el primer
// vistazo) sin tener que parsear y ejecutar antes el JS de secciones que
// todavía no están a la vista (reserva, mapa, footer, etc). Ver el
// comentario en BelowFold.tsx.
const BelowFold = lazy(() => import("../components/BelowFold").then((m) => ({ default: m.BelowFold })));

export function HomePage() {
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    api
      .getBusiness()
      .then(setBusiness)
      .catch(() => setApiDown(true));
    api
      .getServices()
      .then((s) => {
        setServices(s);
        if (s.length > 0) setSelectedServiceId((prev) => prev ?? s[0].id);
      })
      .catch(() => setApiDown(true))
      .finally(() => setLoadingServices(false));
  }, []);

  return (
    <div className="relative min-h-screen">
      <BackgroundFX />

      {apiDown && (
        <div className="relative z-50 bg-red-500/90 px-5 py-2 text-center text-sm text-white">
          No se pudo conectar con el servidor de turnos. Iniciá la API (apps/api) para ver datos reales.
        </div>
      )}

      <Header />
      <Hero business={business} />

      <Suspense fallback={null}>
        <BelowFold
          business={business}
          services={services}
          loadingServices={loadingServices}
          selectedServiceId={selectedServiceId}
          onSelectService={setSelectedServiceId}
        />
      </Suspense>
    </div>
  );
}
