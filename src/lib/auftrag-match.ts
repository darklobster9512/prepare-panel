export type AuftragTemplate = {
  id: string;
  name: string;
  ident_type: string | null;
  admin_only: boolean;
};

const IDENTS = ["videoident", "postident"] as const;

export function normalizeBank(value: string): string {
  return value
    .toLowerCase()
    .replace(/video-?ident|post-?ident/g, "")
    .replace(/[^a-z0-9äöüß]/g, "");
}

/** Löst Einträge wie „DeutscheBank-videoident" in Auftragsvorlagen auf. */
export function matchAuftraege(
  entries: unknown,
  templates: AuftragTemplate[],
): { ids: string[]; errors: string[] } {
  const errors: string[] = [];
  const ids: string[] = [];
  const webde = templates.find((t) => normalizeBank(t.name) === "webde");
  if (webde) ids.push(webde.id);
  else errors.push("Auftragsvorlage Web.de nicht gefunden.");

  if (entries === undefined || entries === null) return { ids, errors };
  if (!Array.isArray(entries) || entries.length > 20) {
    errors.push("auftraege muss eine Liste mit höchstens 20 Einträgen sein.");
    return { ids, errors };
  }

  const usable = templates.filter((t) => !t.admin_only);
  for (const raw of entries) {
    const entry = String(raw ?? "").trim();
    const m = entry.match(/^(.+)-(videoident|postident)$/i);
    if (!m) {
      errors.push(`Auftrag „${entry}" hat nicht das Format Bank-videoident oder Bank-postident.`);
      continue;
    }
    const bank = normalizeBank(m[1]!);
    const ident = m[2]!.toLowerCase() as (typeof IDENTS)[number];
    if (bank === "webde") continue;
    const candidates = usable.filter((t) => normalizeBank(t.name) === bank);
    if (candidates.length === 0) {
      errors.push(`Auftrag „${entry}": Bank nicht gefunden.`);
      continue;
    }
    const chosen = candidates.find((t) => t.ident_type === ident) ?? candidates[0]!;
    if (!ids.includes(chosen.id)) ids.push(chosen.id);
  }
  return { ids, errors };
}
