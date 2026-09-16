import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VicRow = {
  id: string;
  first_name: string;
  last_name: string;
  birth_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  street: string | null;
  postal_code: string | null;
  city: string | null;
  marital_status: string | null;
  tax_id: string | null;
  bank: string | null;
  notes: string | null;
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

const optional = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((value) => (value ? value : null));

const vicSchema = z.object({
  first_name: z.string().trim().min(1, "Bitte einen Vornamen eingeben.").max(120),
  last_name: z.string().trim().min(1, "Bitte einen Nachnamen eingeben.").max(120),
  birth_name: optional,
  birth_date: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  birth_place: optional,
  street: optional,
  postal_code: optional,
  city: optional,
  marital_status: optional,
  tax_id: optional,
  bank: optional,
  notes: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : null)),
});

const SELECT_COLUMNS =
  "id, first_name, last_name, birth_date, birth_place, street, postal_code, city, marital_status, tax_id, bank, notes, created_at";

export const listVics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VicRow[]> => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("vics")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false });

    if (error) throw new Error("Datensätze konnten nicht geladen werden.");
    return (data ?? []) as VicRow[];
  });

export const createVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => vicSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("vics")
      .insert({ ...data, created_by: context.userId });

    if (error) throw new Error("Datensatz konnte nicht gespeichert werden.");
    return { ok: true };
  });

export const updateVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    vicSchema.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { id, ...values } = data;
    const { error } = await context.supabase.from("vics").update(values).eq("id", id);

    if (error) throw new Error("Datensatz konnte nicht aktualisiert werden.");
    return { ok: true };
  });

export const deleteVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase.from("vics").delete().eq("id", data.id);
    if (error) throw new Error("Datensatz konnte nicht gelöscht werden.");
    return { ok: true };
  });
