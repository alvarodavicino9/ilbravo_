import { motion } from "framer-motion";
import type { BusinessInfo, Service } from "../lib/api";
import { HowItWorks } from "./HowItWorks";
import { Stats } from "./Stats";
import { WhyUs } from "./WhyUs";
import { ServicesSection } from "./ServicesSection";
import { BookingWizard } from "./BookingWizard";
import { LocationHours } from "./LocationHours";
import { Footer } from "./Footer";
import { WhatsappFab } from "./WhatsappFab";

/**
 * Todo lo que va debajo del Hero, agrupado en un solo componente que
 * HomePage carga con React.lazy: el Header y el Hero son lo único que
 * hace falta para el primer dibujo de la página, así que el navegador no
 * tiene por qué esperar a parsear/ejecutar el JS de secciones que ni
 * siquiera están a la vista todavía (formulario de reserva, mapa, footer,
 * etc). Esto se pide apenas el Hero terminó de montar (no recién al
 * hacer scroll), así en una conexión normal ya está listo antes de que
 * el usuario llegue a esa parte de la página — pero deja de competir por
 * el hilo principal justo en el momento más crítico: los primeros
 * cuadros después de que llega el HTML.
 */
export function BelowFold({
  business,
  services,
  loadingServices,
  selectedServiceId,
  onSelectService,
}: {
  business: BusinessInfo | null;
  services: Service[];
  loadingServices: boolean;
  selectedServiceId: string | null;
  onSelectService: (id: string) => void;
}) {
  return (
    <>
      <HowItWorks />
      <Stats business={business} services={services} />
      <WhyUs />
      <ServicesSection
        services={services}
        loading={loadingServices}
        selectedId={selectedServiceId}
        onSelect={onSelectService}
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
              onSelectService={onSelectService}
              business={business}
            />
          </div>
        </div>
      </section>

      <LocationHours business={business} />
      <Footer business={business} />
      <WhatsappFab business={business} />
    </>
  );
}
