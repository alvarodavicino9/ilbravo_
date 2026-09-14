import { Suspense, lazy } from "react";
import { HomePage } from "./pages/HomePage";

// El panel de admin se carga aparte (lazy): así los clientes que solo
// entran a reservar un turno no descargan el código del panel del dueño
// (tabla, gráfico de ingresos, modales, etc), que nunca van a usar. Menos
// para descargar en el celular = la página aparece más rápido.
const AdminPage = lazy(() => import("./pages/AdminPage").then((m) => ({ default: m.AdminPage })));

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink text-sm text-paper/40">
      Cargando panel…
    </div>
  );
}

// Solo hay dos rutas estáticas (home y admin), así que un router completo
// (react-router-dom) es peso de más para descargar y parsear sin necesidad:
// alcanza con mirar el pathname una vez al cargar.
function App() {
  const isAdmin = window.location.pathname.replace(/\/+$/, "") === "/admin";

  if (isAdmin) {
    return (
      <Suspense fallback={<AdminFallback />}>
        <AdminPage />
      </Suspense>
    );
  }

  return <HomePage />;
}

export default App;
