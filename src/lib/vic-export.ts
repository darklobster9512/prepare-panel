import type { VicAuftrag } from "@/lib/vic-auftraege.types";
import type { VicRow } from "@/lib/vics.functions";

function orDash(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : "–";
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatBirthDate(value: string | null): string {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("de-DE");
}

/** Passwort des Web.de-/E-Mail-Auftrags (generiertes Web-Account-Passwort). */
function findEmailPassword(vic: VicRow): string | null {
  const emailAuftrag = (vic.auftraege ?? []).find(
    (item) => item.ident_type === "email" && item.password,
  );
  if (emailAuftrag?.password) return emailAuftrag.password;
  const withPassword = (vic.auftraege ?? []).find((item) => item.password);
  return withPassword?.password ?? null;
}

export function buildExportText(
  vic: VicRow,
  item: VicAuftrag,
  shareLink: string | null,
): string {
  const addressParts = [vic.street?.trim() ?? "", [vic.postal_code?.trim() ?? "", vic.city?.trim() ?? ""].filter(Boolean).join(" ")]
    .filter(Boolean)
    .join("\n");

  const lines: string[] = [
    `=== ${titleCase(`${vic.first_name} ${vic.last_name}`.trim())} ===`,
  ];

  const notes = vic.notes?.trim();
  if (notes) lines.push(notes);

  lines.push(
    `Vorname: ${orDash(vic.first_name)}`,
    `Nachname: ${orDash(vic.last_name)}`,
    `Geburtsdatum: ${formatBirthDate(vic.birth_date)}`,
    `Geburtsort: ${orDash(vic.birth_place)}`,
    addressParts || "–",
    `Familienstand: ${orDash(vic.marital_status)}`,
    `Steuer-ID: ${orDash(vic.tax_id)}`,
    `Aktuelle Bank: ${orDash(vic.bank)}`,
    "",
    orDash(vic.email_address),
    orDash(findEmailPassword(vic)),
    "",
    item.auftrag_name || "–",
    `Nummer: ${orDash(vic.phone_number)}`,
    orDash(item.webid_link ?? item.postident_link),
    orDash(shareLink),
  );

  return lines.join("\n");
}
