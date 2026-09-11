import type { NextFunction, Request, Response } from "express";

/**
 * Autenticación simple por token para las rutas de administración
 * (ver/cancelar turnos, exportar Excel). Pensada para uso interno
 * del local, no para exponer a clientes.
 *
 * El token se manda como header:  Authorization: Bearer <ADMIN_TOKEN>
 */
export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_TOKEN no configurado en el servidor" });
  }

  const header = req.header("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (token !== expected) {
    return res.status(401).json({ error: "No autorizado" });
  }

  next();
}
