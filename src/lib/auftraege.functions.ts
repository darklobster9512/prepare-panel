import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type IdentType = "videoident" | "postident";

export type AuftragRow = {
  id: string;
  name: string;
  logo_path: string | null;
  ident_type: IdentType | null;
  besonderheiten: string | null;
  images: string[];
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
  ident_type: z.enum(["videoident", "postident"]).nullable().optional(),
  besonderheiten: z.string().trim().max(5000).nullable().optional(),
  images: z.array(z.string().trim().max(500)).max(50).optional(),
});

export const listAuftraege = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AuftragRow[]> => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("auftraege")
      .select("id, name, logo_path, ident_type, besonderheiten, images, created_at")
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
      .update({ name: data.name, logo_path: data.logo_path ?? null })
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
