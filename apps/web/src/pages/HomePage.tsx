import { useEffect, useState } from "react";
import { api, type BusinessInfo, type Service } from "../lib/api";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { ServicesSection } from "../components/ServicesSection";
import { BookingWizard } from "../components/BookingWizard";
import { LocationHours } from "../components/LocationHours";
import { Footer } from "../components/Footer";
import { WhatsappFab } from "../components/WhatsappFab";

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
    <div className="min-h-screen bg-ink">
      {apiDown && (
        <div className="bg-red-500/90 px-5 py-2 text-center text-sm text-white">
          No se pudo conectar con el servidor de turnos. Iniciá la API (apps/api) para ver datos reales.
        </div>
      )}

      <Header business={business} />
      <Hero business={business} />
      <ServicesSection
        services={services}
        loading={loadingServices}
        selectedId={selectedServiceId}
        onSelect={setSelectedServiceId}
      />

      <section id="reservar" className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <h2 className="font-display text-4xl tracking-wide text-paper">Reservá tu turno</h2>
          <p className="mt-2 text-paper/60">Elegí servicio, día y horario disponible.</p>

          <div className="mt-10">
            <BookingWizard
              services={services}
              selectedServiceId={selectedServiceId}
              onSelectService={setSelectedServiceId}
            />
          </div>
        </div>
      </section>

      <LocationHours business={business} />
      <Footer />
      <WhatsappFab business={business} />
    </div>
  );
}
