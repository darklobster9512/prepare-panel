import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
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

const SELECT_COLUMNS =
  "id, auftrag_id, login_name, password, status, internal_mark, used_login_name, used_password, webid_link, postident_link, completed_at, auftraege(name, logo_path, admin_only)";

function mapRow(row: any): VicAuftrag {
  return {
    id: row.id,
    auftrag_id: row.auftrag_id,
    auftrag_name: row.auftraege?.name ?? "",
    logo_path: row.auftraege?.logo_path ?? null,
    admin_only: Boolean(row.auftraege?.admin_only),
    login_name: row.login_name ?? null,
    password: row.password ?? null,
    status: (row.status ?? "offen") as VicAuftrag["status"],
    used_login_name: row.used_login_name ?? null,
    used_password: row.used_password ?? null,
    webid_link: row.webid_link ?? null,
    postident_link: row.postident_link ?? null,
    completed_at: row.completed_at ?? null,
    internal_mark: (row.internal_mark ?? null) as VicAuftrag["internal_mark"],
  };
}

const internalMarkSchema = z.object({
  id: z.string().uuid(),
  mark: z.enum(["gestartet", "erledigt", "abgesprungen"]).nullable(),
});

/** Setzt die rein interne Kennzeichnung eines Auftrags (Adminbereich). */
export const setVicAuftragInternalMark = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => internalMarkSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("vic_auftraege")
      .update({ internal_mark: data.mark })
      .eq("id", data.id);

    if (error) throw new Error("Kennzeichnung konnte nicht gespeichert werden.");
    return { ok: true, mark: data.mark };
  });

const pairSchema = z.object({
  vic_id: z.string().uuid(),
  auftrag_id: z.string().uuid(),
});

export const assignAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pairSchema.parse(data))
  .handler(async ({ data, context }): Promise<VicAuftrag> => {
    await assertAdmin(context.supabase, context.userId);

    const { buildCredentials } = await import("@/lib/vic-auftraege.server");
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
        ...(credentials.admin_only
          ? {
              status: "erfolgreich",
              completed_at: new Date().toISOString(),
              completed_by: context.userId,
            }
          : {}),
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw new Error("Auftrag konnte nicht zugewiesen werden.");

    if (!credentials.admin_only) {
      // Abgeschlossene Datensätze wieder öffnen, damit der Mitarbeiter weiterarbeiten kann.
      const { data: vic } = await context.supabase
        .from("vics")
        .select("completed_at")
        .eq("id", data.vic_id)
        .maybeSingle();

      if (vic?.completed_at) {
        await context.supabase
          .from("vics")
          .update({ completed_at: null, completed_by: null })
          .eq("id", data.vic_id);
      }
    }

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

const bulkSchema = z.object({
  vic_id: z.string().uuid(),
  add_auftrag_ids: z.array(z.string().uuid()).max(50),
  remove_auftrag_ids: z.array(z.string().uuid()).max(50),
});

export const assignAuftraegeBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bulkSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    if (data.remove_auftrag_ids.length > 0) {
      const { error } = await context.supabase
        .from("vic_auftraege")
        .delete()
        .eq("vic_id", data.vic_id)
        .in("auftrag_id", data.remove_auftrag_ids);

      if (error) throw new Error("Zuweisungen konnten nicht entfernt werden.");
    }

    const added: VicAuftrag[] = [];

    for (const auftragId of data.add_auftrag_ids) {
      const { buildCredentials } = await import("@/lib/vic-auftraege.server");
    const credentials = await buildCredentials(
        context.supabase,
        data.vic_id,
        auftragId,
      );

      const { data: row, error } = await context.supabase
        .from("vic_auftraege")
        .insert({
          vic_id: data.vic_id,
          auftrag_id: auftragId,
          login_name: credentials.login_name,
          password: credentials.password,
          created_by: context.userId,
          ...(credentials.admin_only
            ? {
                status: "erfolgreich",
                completed_at: new Date().toISOString(),
                completed_by: context.userId,
              }
            : {}),
        })
        .select(SELECT_COLUMNS)
        .single();

      if (error) throw new Error("Auftrag konnte nicht zugewiesen werden.");
      added.push(mapRow(row));
    }

    const publicAdded = added.filter((item) => !item.admin_only);

    if (publicAdded.length > 0) {
      // Abgeschlossene Datensätze wieder öffnen, damit der Mitarbeiter weiterarbeiten kann.
      const { data: vic } = await context.supabase
        .from("vics")
        .select("completed_at")
        .eq("id", data.vic_id)
        .maybeSingle();

      if (vic?.completed_at) {
        await context.supabase
          .from("vics")
          .update({ completed_at: null, completed_by: null })
          .eq("id", data.vic_id);
      }
    }

    if (publicAdded.length > 0) {
      try {
        const { data: recipients } = await context.supabase
          .from("telegram_recipients")
          .select("chat_id")
          .eq("active", true);

        const chatIds = ((recipients ?? []) as Array<{ chat_id: string }>).map(
          (row) => row.chat_id,
        );

        if (chatIds.length > 0) {
          const { data: vicRow } = await context.supabase
            .from("vics")
            .select("first_name, last_name")
            .eq("id", data.vic_id)
            .maybeSingle();

          const vicName =
            `${vicRow?.first_name ?? ""} ${vicRow?.last_name ?? ""}`.trim() ||
            "Unbekannt";

          const { broadcastTelegramMessage, buildNewAuftraegeMessage } =
            await import("@/lib/telegram.server");

          await broadcastTelegramMessage(
            chatIds,
            buildNewAuftraegeMessage({
              vicName,
              auftragNames: publicAdded.map((item) => item.auftrag_name),
            }),
          );
        }
      } catch (err) {
        console.error(
          "Telegram-Benachrichtigung fehlgeschlagen:",
          err instanceof Error ? err.message : err,
        );
      }
    }

    return { added, removed: data.remove_auftrag_ids };
  });

export const regenerateCredentials = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => pairSchema.parse(data))
  .handler(async ({ data, context }): Promise<VicAuftrag> => {
    await assertAdmin(context.supabase, context.userId);

    const { buildCredentials } = await import("@/lib/vic-auftraege.server");
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
