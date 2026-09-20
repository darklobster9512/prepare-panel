import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { VicAuftrag } from "@/lib/vic-auftraege.types";

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
  project_id: string | null;
  claimed_by: string | null;
  completed_at: string | null;
  email_address: string | null;
  email_street: string | null;
  email_postal_code: string | null;
  email_city: string | null;
  email_birth_date: string | null;
  project_name: string | null;
  auftraege: VicAuftrag[];
  phone_number: string | null;
  phone_end_date: string | null;
  phone_order_booking_id: number | null;
  phone_share_link: string | null;
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
  project_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((value) => (value ? value : null)),
});

const assignmentSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid().nullable(),
});

const SELECT_COLUMNS =
  "id, first_name, last_name, birth_name, birth_date, birth_place, street, postal_code, city, marital_status, tax_id, bank, notes, project_id, claimed_by, completed_at, email_address, email_street, email_postal_code, email_city, email_birth_date, created_at, projects(name), anosim_numbers(order_booking_id, number, end_date, share_link), vic_auftraege(id, auftrag_id, login_name, password, status, used_login_name, used_password, webid_link, postident_link, completed_at, auftraege(name, logo_path, admin_only, ident_type))";

type RawVicRow = Omit<
  VicRow,
  | "project_name"
  | "auftraege"
  | "phone_number"
  | "phone_end_date"
  | "phone_order_booking_id"
  | "phone_share_link"
> & {
  projects: { name: string } | null;
  anosim_numbers:
    | {
        order_booking_id: number | null;
        number: string | null;
        end_date: string | null;
        share_link: string | null;
      }[]
    | null;
  vic_auftraege: any[] | null;
};

function mapVic(row: RawVicRow): VicRow {
  const { projects, vic_auftraege, anosim_numbers, ...rest } = row;
  const phone = (anosim_numbers ?? [])[0] ?? null;
  return {
    ...rest,
    project_name: projects?.name ?? null,
    phone_number: phone?.number ?? null,
    phone_end_date: phone?.end_date ?? null,
    auftraege: (vic_auftraege ?? []).map((item) => ({
      id: item.id,
      auftrag_id: item.auftrag_id,
      auftrag_name: item.auftraege?.name ?? "",
      logo_path: item.auftraege?.logo_path ?? null,
      admin_only: Boolean(item.auftraege?.admin_only),
      login_name: item.login_name ?? null,
      password: item.password ?? null,
      status: (item.status ?? "offen") as VicAuftrag["status"],
      used_login_name: item.used_login_name ?? null,
      used_password: item.used_password ?? null,
      webid_link: item.webid_link ?? null,
      postident_link: item.postident_link ?? null,
      completed_at: item.completed_at ?? null,
    })),
  };
}

export const listVics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VicRow[]> => {
    await assertAdmin(context.supabase, context.userId);

    const { data, error } = await context.supabase
      .from("vics")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw new Error("Datensätze konnten nicht geladen werden.");
    return ((data ?? []) as unknown as RawVicRow[]).map(mapVic);
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

export const createVicsBulk = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        records: z
          .array(vicSchema)
          .min(1, "Keine Datensätze erkannt.")
          .max(200, "Maximal 200 Datensätze pro Import."),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const rows = data.records.map((record) => ({
      ...record,
      created_by: context.userId,
    }));

    const { error } = await context.supabase.from("vics").insert(rows);
    if (error) throw new Error("Datensätze konnten nicht gespeichert werden.");
    return { ok: true, count: rows.length };
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

export const assignVicProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => assignmentSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);

    const { error } = await context.supabase
      .from("vics")
      .update({ project_id: data.project_id })
      .eq("id", data.id);

    if (error) throw new Error("Projekt konnte nicht zugewiesen werden.");
    return { ok: true };
  });
