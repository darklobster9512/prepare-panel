import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type TelegramRecipient = {
  id: string;
  chat_id: string;
  label: string | null;
  active: boolean;
  created_at: string;
};

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

const SELECT_COLUMNS = "id, chat_id, label, active, created_at";

export const listTelegramRecipients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<TelegramRecipient[]> => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("telegram_recipients")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: true });

    if (error) throw new Error("Empfänger konnten nicht geladen werden.");
    return (data ?? []) as TelegramRecipient[];
  });

const createSchema = z.object({
  chat_id: z
    .string()
    .trim()
    .min(2, "Bitte eine gültige Chat-ID eingeben.")
    .max(64, "Chat-ID ist zu lang."),
  label: z.string().trim().max(80).optional().nullable(),
});

export const createTelegramRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }): Promise<TelegramRecipient> => {
    await assertAdmin(context.supabase, context.userId);

    const { data: row, error } = await context.supabase
      .from("telegram_recipients")
      .insert({
        chat_id: data.chat_id,
        label: data.label?.trim() ? data.label.trim() : null,
        created_by: context.userId,
      })
      .select(SELECT_COLUMNS)
      .single();

    if (error) {
      if (error.code === "23505") throw new Error("Diese Chat-ID ist bereits hinterlegt.");
      throw new Error("Empfänger konnte nicht gespeichert werden.");
    }

    return row as TelegramRecipient;
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  active: z.boolean().optional(),
  label: z.string().trim().max(80).optional().nullable(),
});

export const updateTelegramRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data, context }): Promise<TelegramRecipient> => {
    await assertAdmin(context.supabase, context.userId);

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof data.active === "boolean") patch["active"] = data.active;
    if (data.label !== undefined) {
      patch["label"] = data.label?.trim() ? data.label.trim() : null;
    }

    const { data: row, error } = await context.supabase
      .from("telegram_recipients")
      .update(patch)
      .eq("id", data.id)
      .select(SELECT_COLUMNS)
      .single();

    if (error) throw new Error("Empfänger konnte nicht aktualisiert werden.");
    return row as TelegramRecipient;
  });

export const deleteTelegramRecipient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("telegram_recipients")
      .delete()
      .eq("id", data.id);

    if (error) throw new Error("Empfänger konnte nicht gelöscht werden.");
    return { ok: true };
  });

export const sendTelegramTest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { data: row, error } = await context.supabase
      .from("telegram_recipients")
      .select("chat_id")
      .eq("id", data.id)
      .maybeSingle();

    if (error || !row) throw new Error("Empfänger wurde nicht gefunden.");

    const { sendTelegramMessage } = await import("@/lib/telegram.server");
    await sendTelegramMessage(
      row.chat_id,
      "✅ <b>Testnachricht</b>\n\nDie Verbindung zu IdentPanel funktioniert.",
    );

    return { ok: true };
  });
