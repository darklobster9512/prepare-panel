import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const BANK_DOCUMENTS_BUCKET = "bank-documents";

export type BankCredential = { label: string; value: string };
export type BankDocument = { path: string; name: string; type: string; size: number };

export type BankAccountRow = {
  id: string;
  account_holder: string;
  bank: string;
  iban: string | null;
  project_id: string | null;
  project_name: string | null;
  letters_complete: boolean | null;
  coupled: boolean;
  vmos_device: string | null;
  credentials: BankCredential[];
  anosim_link: string | null;
  notes: string | null;
  documents: BankDocument[];
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

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .nullish()
    .transform((value) => {
      const cleaned = (value ?? "").trim();
      return cleaned ? cleaned : null;
    });

const bankAccountSchema = z.object({
  account_holder: z.string().trim().min(1, "Bitte den Kontoinhaber eingeben.").max(200),
  bank: z.string().trim().min(1, "Bitte die Bank eingeben.").max(200),
  iban: optionalText(64).transform((v) => (v ? v.replace(/\s+/g, "").toUpperCase() : null)),
  project_id: z.string().uuid().nullish().transform((v) => v ?? null),
  letters_complete: z.boolean().nullable(),
  coupled: z.boolean(),
  vmos_device: optionalText(200),
  credentials: z
    .array(z.object({ label: z.string().max(200), value: z.string().max(2000) }))
    .max(100)
    .transform((list) =>
      list
        .map((c) => ({ label: c.label.trim(), value: c.value.trim() }))
        .filter((c) => c.label || c.value),
    ),
  anosim_link: optionalText(2000),
  notes: optionalText(10000),
  documents: z
    .array(
      z.object({
        path: z.string().min(1).max(500),
        name: z.string().max(300),
        type: z.string().max(200),
        size: z.number().int().nonnegative(),
      }),
    )
    .max(500),
});

function mapRow(row: any): BankAccountRow {
  return {
    id: row.id,
    account_holder: row.account_holder,
    bank: row.bank,
    iban: row.iban,
    project_id: row.project_id,
    project_name: row.projects?.name ?? null,
    letters_complete: row.letters_complete,
    coupled: row.coupled,
    vmos_device: row.vmos_device,
    credentials: Array.isArray(row.credentials) ? row.credentials : [],
    anosim_link: row.anosim_link,
    notes: row.notes,
    documents: Array.isArray(row.documents) ? row.documents : [],
    created_at: row.created_at,
  };
}

export const listBankAccounts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<BankAccountRow[]> => {
    await assertAdmin(context.supabase, context.userId);
    const { data, error } = await (context.supabase as any)
      .from("bank_accounts")
      .select("*, projects(name)")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Bankkonten konnten nicht geladen werden.");
    return (data ?? []).map(mapRow);
  });

export const createBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bankAccountSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { error } = await (context.supabase as any)
      .from("bank_accounts")
      .insert({ ...data, created_by: context.userId });
    if (error) throw new Error("Bankkonto konnte nicht gespeichert werden.");
    return { ok: true };
  });

export const updateBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    bankAccountSchema.extend({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { id, ...values } = data;
    const { error } = await (context.supabase as any)
      .from("bank_accounts")
      .update(values)
      .eq("id", id);
    if (error) throw new Error("Bankkonto konnte nicht aktualisiert werden.");
    return { ok: true };
  });

export const deleteBankAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const sb = context.supabase as any;
    const { data: row } = await sb
      .from("bank_accounts")
      .select("documents")
      .eq("id", data.id)
      .maybeSingle();
    const paths = (Array.isArray(row?.documents) ? row.documents : [])
      .map((d: BankDocument) => d.path)
      .filter(Boolean);
    if (paths.length > 0) {
      await sb.storage.from(BANK_DOCUMENTS_BUCKET).remove(paths);
    }
    const { error } = await sb.from("bank_accounts").delete().eq("id", data.id);
    if (error) throw new Error("Bankkonto konnte nicht gelöscht werden.");
    return { ok: true };
  });
