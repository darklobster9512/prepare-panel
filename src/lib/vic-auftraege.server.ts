import {
  generateInternalPassword,
  generateLoginName,
  generateVicPassword,
  generateYearPassword,
} from "@/lib/password";

export async function buildCredentials(supabase: any, vicId: string, auftragId: string) {
  const { data: vic, error: vicError } = await supabase
    .from("vics")
    .select("first_name, last_name, birth_date")
    .eq("id", vicId)
    .maybeSingle();

  if (vicError || !vic) throw new Error("Vic-Datensatz konnte nicht geladen werden.");

  const { data: auftrag, error: auftragError } = await supabase
    .from("auftraege")
    .select("name, generate_password, generate_loginname, admin_only")
    .eq("id", auftragId)
    .maybeSingle();

  if (auftragError || !auftrag) throw new Error("Auftrag konnte nicht geladen werden.");

  let password: string | null = null;

  if (auftrag.admin_only) {
    return {
      admin_only: true,
      password: generateInternalPassword(vic.first_name),
      login_name: null,
    };
  }

  if (auftrag.generate_password) {
    if (auftrag.name === "BBVA") {
      // Festes Muster: Vorname + laufendes Jahr (z. B. Dominik2026).
      password = generateYearPassword(vic.first_name);
    } else {
      // Passwörter der anderen Aufträge dieses Vics laden, damit kein Wert doppelt vorkommt.
      const { data: existing } = await supabase
        .from("vic_auftraege")
        .select("auftrag_id, password")
        .eq("vic_id", vicId);

      const taken = new Set(
        ((existing ?? []) as Array<{ auftrag_id: string; password: string | null }>)
          .filter((row) => row.auftrag_id !== auftragId && row.password)
          .map((row) => row.password as string),
      );

      for (let attempt = 0; attempt < 10; attempt += 1) {
        password = generateVicPassword(vic.first_name);
        if (!taken.has(password)) break;
      }
    }
  }

  return {
    admin_only: false,
    password,
    login_name: auftrag.generate_loginname
      ? generateLoginName(vic.last_name, vic.birth_date)
      : null,
  };
}
