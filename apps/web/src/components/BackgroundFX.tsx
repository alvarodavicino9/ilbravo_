/**
 * Capa de fondo fija, compartida por toda la página: manchas de luz
 * doradas que se desplazan muy lentamente sobre el negro plano. Le da
 * profundidad sin distraer del contenido (sin grilla: quedaba muy cargado
 * sobre tablas y tarjetas de datos).
 *
 * Antes esto se animaba con framer-motion (un loop en JS recalculando x/y
 * cuadro a cuadro) y con blur de 130-140px — carísimo para la GPU de un
 * celular de gama media, justo en los primeros segundos en que el celular
 * ya está ocupado bajando y ejecutando el JS de la página. Ahora son
 * simples @keyframes de CSS (el navegador las anima aparte, sin depender
 * de que React/framer-motion ya hayan cargado) con un blur bastante menor.
 */
export function BackgroundFX() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink">
      <div className="bg-blob absolute -left-40 top-[-10%] h-[520px] w-[520px] rounded-full bg-gold/10 blur-[70px]" />
      <div
        className="bg-blob absolute right-[-15%] top-[20%] h-[460px] w-[460px] rounded-full bg-ember/10 blur-[70px]"
        style={{ animationDuration: "32s", animationDirection: "reverse" }}
      />
      <div
        className="bg-blob absolute bottom-[-15%] left-[20%] h-[480px] w-[480px] rounded-full bg-gold/5 blur-[80px]"
        style={{ animationDuration: "38s" }}
      />
    </div>
  );
}
