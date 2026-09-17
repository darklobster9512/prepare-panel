import type { AuftragStatus } from "@/lib/mitarbeiter.types";

export const STATUS_LABELS: Record<AuftragStatus, string> = {
  offen: "Unbearbeitet",
  erfolgreich: "Erfolgreich",
  fehlgeschlagen: "Fehlgeschlagen",
};

/** Farbige Umrandung: grau = unbearbeitet, blau = beansprucht, grün/rot = Ergebnis. */
export function statusRingClass(
  status: AuftragStatus,
  claimed: boolean,
  adminOnly = false,
): string {
  if (adminOnly) return "ring-2 ring-purple-500";
  if (status === "erfolgreich") return "ring-2 ring-emerald-500";
  if (status === "fehlgeschlagen") return "ring-2 ring-destructive";
  if (claimed) return "ring-2 ring-primary";
  return "ring-2 ring-border";
}

export function statusLabel(
  status: AuftragStatus,
  claimed: boolean,
  adminOnly = false,
): string {
  if (adminOnly) return "Intern";
  if (status === "offen" && claimed) return "Beansprucht";
  return STATUS_LABELS[status];
}
