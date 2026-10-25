import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppSettings = { auto_buy_number: boolean };

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

export const getSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppSettings> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any)
      .from("app_settings")
      .select("auto_buy_number")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error("Einstellungen konnten nicht geladen werden.");
    return { auto_buy_number: data?.auto_buy_number ?? true };
  });

export const updateSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ auto_buy_number: z.boolean() }).parse(input))
  .handler(async ({ data, context }): Promise<AppSettings> => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any)
      .from("app_settings")
      .update({ auto_buy_number: data.auto_buy_number })
      .eq("id", 1);
    if (error) throw new Error("Einstellungen konnten nicht gespeichert werden.");
    return data;
  });
