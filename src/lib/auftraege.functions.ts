import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IdentType = "videoident" | "postident" | "email";

export type AuftragRow = {
  id: string;
  name: string;
  logo_path: string | null;
  ident_type: IdentType | null;
  besonderheiten: string | null;
  images: string[];
  generate_password: boolean;
  generate_loginname: boolean;
  admin_only: boolean;
  sort_order: number;
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

const auftragSchema = z.object({
  name: z.string().trim().min(1, "Bitte einen Namen eingeben.").max(200),
  logo_path: z.string().trim().max(500).nullable().optional(),
  ident_type: z.enum(["videoident", "postident", "email"]).nullable().optional(),
  besonderheiten: z.string().trim().max(5000).nullable().optional(),
  images: z.array(z.string().trim().max(500)).max(50).optional(),
  generate_password: z.boolean().optional(),
  generate_loginname: z.boolean().optional(),
  admin_only: z.boolean().optional(),
  sort_order: z.number().int().min(0).max(9999).optional(),
});

export const listAuftraege = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuftragRow[]> => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("auftraege")
      .select(
        "id, name, logo_path, ident_type, besonderheiten, images, generate_password, generate_loginname, admin_only, sort_order, created_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error("Aufträge konnten nicht geladen werden.");
    return ((data ?? []) as any[]).map((row) => ({
      ...row,
      images: Array.isArray(row.images) ? (row.images as string[]) : [],
    })) as AuftragRow[];
  });

export const createAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => auftragSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase.from("auftraege").insert({
      name: data.name,
      logo_path: data.logo_path ?? null,
      ident_type: data.ident_type ?? null,
      besonderheiten: data.besonderheiten ?? null,
      images: data.images ?? [],
      generate_password: data.generate_password ?? false,
      generate_loginname: data.generate_loginname ?? false,
      admin_only: data.admin_only ?? false,
      sort_order: data.sort_order ?? 100,
      created_by: context.userId,
    });

    if (error) throw new Error("Auftrag konnte nicht gespeichert werden.");
    return { ok: true };
  });

export const updateAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    auftragSchema.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("auftraege")
      .update({
        name: data.name,
        logo_path: data.logo_path ?? null,
        ident_type: data.ident_type ?? null,
        besonderheiten: data.besonderheiten ?? null,
        images: data.images ?? [],
        generate_password: data.generate_password ?? false,
        generate_loginname: data.generate_loginname ?? false,
        admin_only: data.admin_only ?? false,
        sort_order: data.sort_order ?? 100,
      })
      .eq("id", data.id);

    if (error) throw new Error("Auftrag konnte nicht aktualisiert werden.");
    return { ok: true };
  });

export const deleteAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase.from("auftraege").delete().eq("id", data.id);
    if (error) throw new Error("Auftrag konnte nicht gelöscht werden.");
    return { ok: true };
  });
