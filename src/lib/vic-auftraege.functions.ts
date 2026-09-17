import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateLoginName, generateVicPassword } from "@/lib/password";
import type { VicAuftrag } from "@/lib/vic-auftraege.types";

export type { VicAuftrag };

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();

  if (error) throw new Error("Rolle konnte nicht geprüft werden.");
  if (!data) throw new Error("Kein Adminzugriff.");
}

async function buildCredentials(supabase: any, vicId: string, auftragId: string) {
  const { data: vic, error: vicError } = await supabase
    .from("vics")
    .select("first_name, last_name, birth_date")
    .eq("id", vicId)
    .maybeSingle();

  if (vicError || !vic) throw new Error("Vic-Datensatz konnte nicht geladen werden.");

  const { data: auftrag, error: auftragError } = await supabase
    .from("auftraege")
    .select("generate_password, generate_loginname")
    .eq("id", auftragId)
    .maybeSingle();

  if (auftragError || !auftrag) throw new Error("Auftrag konnte nicht geladen werden.");

  let password: string | null = null;

  if (auftrag.generate_password) {
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

  return {
    password,
    login_name: auftrag.generate_loginname
      ? generateLoginName(vic.last_name, vic.birth_date)
      : null,
  };
}

const SELECT_COLUMNS =
  "id, auftrag_id, login_name, password, status, used_login_name, used_password, webid_link, postident_link, completed_at, auftraege(name, logo_path)";

function mapRow(row: any): VicAuftrag {
  return {
    id: row.id,
    auftrag_id: row.auftrag_id,
    auftrag_name: row.auftraege?.name ?? "",
    logo_path: row.auftraege?.logo_path ?? null,
    login_name: row.login_name ?? null,
    password: row.password ?? null,
    status: (row.status ?? "offen") as VicAuftrag["status"],
    used_login_name: row.used_login_name ?? null,
    used_password: row.used_password ?? null,
    webid_link: row.webid_link ?? null,
    postident_link: row.postident_link ?? null,
    completed_at: row.completed_at ?? null,
  };
}

const pairSchema = z.object({
  vic_id: z.string().uuid(),
  auftrag_id: z.string().uuid(),
});

export const assignAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pairSchema.parse(data))
  .handler(async ({ data, context }): Promise<VicAuftrag> => {
    await assertAdmin(context.supabase, context.userId);

    const credentials = await buildCredentials(
      context.supabase,
      data.vic_id,
      data.auftrag_id,
    );

    const { data: row, error } = await context.supabase
      .from("vic_auftraege")
      .insert({
        vic_id: data.vic_id,
        auftrag_id: data.auftrag_id,
        login_name: credentials.login_name,
        password: credentials.password,
        created_by: context.userId,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw new Error("Auftrag konnte nicht zugewiesen werden.");
    return mapRow(row);
  });

export const unassignAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pairSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("vic_auftraege")
      .delete()
      .eq("vic_id", data.vic_id)
      .eq("auftrag_id", data.auftrag_id);

    if (error) throw new Error("Zuweisung konnte nicht entfernt werden.");
    return { ok: true };
  });

export const regenerateCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pairSchema.parse(data))
  .handler(async ({ data, context }): Promise<VicAuftrag> => {
    await assertAdmin(context.supabase, context.userId);

    const credentials = await buildCredentials(
      context.supabase,
      data.vic_id,
      data.auftrag_id,
    );

    const { data: row, error } = await context.supabase
      .from("vic_auftraege")
      .update({
        login_name: credentials.login_name,
        password: credentials.password,
      })
      .eq("vic_id", data.vic_id)
      .eq("auftrag_id", data.auftrag_id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw new Error("Zugangsdaten konnten nicht neu erzeugt werden.");
    return mapRow(row);
  });
