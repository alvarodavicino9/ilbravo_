import { motion } from "framer-motion";

/**
 * Capa de fondo fija, compartida por toda la página: manchas de luz
 * doradas que se desplazan muy lentamente sobre el negro plano. Le da
 * profundidad sin distraer del contenido (sin grilla: quedaba muy cargado
 * sobre tablas y tarjetas de datos).
 */
export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <motion.div
        className="absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-gold/10 blur-[130px]"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[-15%] top-[20%] h-[460px] w-[460px] rounded-full bg-ember/10 blur-[130px]"
        animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
        transition={{ duration: 32, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-15%] left-[20%] h-[480px] w-[480px] rounded-full bg-gold/5 blur-[140px]"
        animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
