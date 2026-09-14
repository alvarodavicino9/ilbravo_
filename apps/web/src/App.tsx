import { Suspense, lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<AdminFallback />}>
              <AdminPage />
            </Suspense>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
