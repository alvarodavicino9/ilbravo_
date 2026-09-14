interface StatusPillProps {
  status: "confirmed" | "cancelled";
}

/** Insignia de estado de un turno, usada en la tabla del panel de admin. */
export function StatusPill({ status }: StatusPillProps) {
  const isConfirmed = status === "confirmed";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isConfirmed ? "bg-emerald-400/10 text-emerald-400" : "bg-red-400/10 text-red-400"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isConfirmed ? "bg-emerald-400" : "bg-red-400"}`} />
      {isConfirmed ? "Confirmado" : "Cancelado"}
    </span>
  );
}
