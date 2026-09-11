import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, type BusinessInfo, type Service } from "../lib/api";
import { BackgroundFX } from "../components/BackgroundFX";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { Stats } from "../components/Stats";
import { WhyUs } from "../components/WhyUs";
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
    <div className="relative min-h-screen">
      <BackgroundFX />

      {apiDown && (
        <div className="relative z-50 bg-red-500/90 px-5 py-2 text-center text-sm text-white">
          No se pudo conectar con el servidor de turnos. Iniciá la API (apps/api) para ver datos reales.
        </div>
      )}

      <Header />
      <Hero business={business} />
      <HowItWorks />
      <Stats business={business} services={services} />
      <WhyUs />
      <ServicesSection
        services={services}
        loading={loadingServices}
        selectedId={selectedServiceId}
        onSelect={setSelectedServiceId}
      />

      <section id="reservar" className="relative border-b border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-4xl tracking-wide text-paper">Reservá tu turno</h2>
            <p className="mt-2 text-paper/60">Elegí servicio, día y horario disponible.</p>
          </motion.div>

          <div className="mt-10">
            <BookingWizard
              services={services}
              selectedServiceId={selectedServiceId}
              onSelectService={setSelectedServiceId}
              business={business}
            />
          </div>
        </div>
      </section>

      <LocationHours business={business} />
      <Footer business={business} />
      <WhatsappFab business={business} />
    </div>
  );
}
