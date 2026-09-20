/**
 * Interne Kennzeichnung eines Auftrags – nur im Adminbereich sichtbar.
 * Unabhängig vom Auftragsstatus, den das Mitarbeiter-Panel setzt.
 */
export type InternalMark = "gestartet" | "erledigt" | "abgesprungen";

export const INTERNAL_MARKS: InternalMark[] = [
  "gestartet",
  "erledigt",
  "abgesprungen",
];

export const INTERNAL_MARK_LABELS: Record<InternalMark, string> = {
  gestartet: "Gestartet",
  erledigt: "Erledigt",
  abgesprungen: "Abgesprungen",
};

/** Ring um Logos/Cards, wenn eine interne Kennzeichnung gesetzt ist. */
export function internalMarkRingClass(mark: InternalMark | null): string {
  if (mark === "gestartet") return "mark-ring-purple";
  if (mark === "erledigt") return "mark-ring-rainbow";
  if (mark === "abgesprungen") return "mark-ring-stripes";
  return "";
}

/** Styling der Auswahl-Buttons (aktiv = gefüllt). */
export function internalMarkButtonClass(
  mark: InternalMark,
  active: boolean,
): string {
  if (!active) {
    return "border-border text-muted-foreground hover:bg-secondary hover:text-foreground";
  }
  if (mark === "gestartet") {
    return "border-purple-500/60 bg-purple-500/15 text-purple-600";
  }
  if (mark === "erledigt") {
    return "mark-chip-rainbow border-transparent text-foreground";
  }
  return "mark-chip-stripes border-transparent text-foreground";
}
