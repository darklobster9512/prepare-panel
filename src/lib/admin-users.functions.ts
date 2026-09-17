import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type EmployeeRow = {
  user_id: string;
  email: string;
  role: string;
  created_at: string;
  onboarding_enabled: boolean;
  gologin_email: string | null;
  gologin_password: string | null;
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

export const listEmployees = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmployeeRow[]> => {
    await assertAdmin(context.supabase, context.userId);

    const { data: profiles, error } = await context.supabase
      .from("profiles")
      .select("user_id, email, created_at")
      .order("created_at", { ascending: false });

    if (error) throw new Error("Konten konnten nicht geladen werden.");

    const { data: roles } = await context.supabase
      .from("user_roles")
      .select("user_id, role");

    const roleByUser = new Map<string, string>();
    for (const r of roles ?? []) roleByUser.set(r.user_id, r.role);

    return (profiles ?? []).map((p) => ({
      user_id: p.user_id,
      email: p.email,
      created_at: p.created_at,
      role: roleByUser.get(p.user_id) ?? "mitarbeiter",
    }));
  });

const createSchema = z.object({
  email: z.string().email("Bitte eine gültige E-Mail-Adresse eingeben."),
  password: z.string().min(6, "Das Passwort muss mindestens 6 Zeichen haben."),
});

export const createEmployee = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
    });

    if (error) {
      const message = error.message.toLowerCase();
      if (message.includes("already") || message.includes("registered")) {
        throw new Error("Diese E-Mail-Adresse wird bereits verwendet.");
      }
      throw new Error("Konto konnte nicht angelegt werden.");
    }

    return { success: true as const };
  });
