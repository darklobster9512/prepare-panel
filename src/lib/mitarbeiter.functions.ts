import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateEmailIdentity } from "@/lib/fake-identity";
import type { AuftragStatus, WorkAuftrag, WorkItem } from "@/lib/mitarbeiter.types";

export type { AuftragStatus, WorkAuftrag, WorkItem };

const SELECT_COLUMNS =
  "id, first_name, last_name, birth_name, birth_date, birth_place, street, postal_code, city, marital_status, tax_id, bank, notes, claimed_by, claimed_at, completed_at, completed_by, email_street, email_postal_code, email_city, email_birth_date, email_address, created_at, anosim_numbers(number, end_date, order_booking_id), vic_auftraege!inner(id, auftrag_id, login_name, password, status, used_login_name, used_password, webid_link, postident_link, auftraege(name, logo_path, ident_type, besonderheiten, images, sort_order, admin_only))";

function mapItem(row: any): WorkItem {
  const { anosim_numbers, vic_auftraege, ...rest } = row;
  const phone = (anosim_numbers ?? [])[0] ?? null;

  const auftraege: WorkAuftrag[] = (vic_auftraege ?? [])
    .filter((item: any) => !item.auftraege?.admin_only)
    .map((item: any) => ({
    id: item.id,
    auftrag_id: item.auftrag_id,
    name: item.auftraege?.name ?? "",
    logo_path: item.auftraege?.logo_path ?? null,
    ident_type: item.auftraege?.ident_type ?? null,
    besonderheiten: item.auftraege?.besonderheiten ?? null,
    images: Array.isArray(item.auftraege?.images) ? item.auftraege.images : [],
    sort_order: Number(item.auftraege?.sort_order ?? 100),
    login_name: item.login_name ?? null,
    password: item.password ?? null,
    status: (item.status ?? "offen") as AuftragStatus,
    used_login_name: item.used_login_name ?? null,
    used_password: item.used_password ?? null,
    webid_link: item.webid_link ?? null,
    postident_link: item.postident_link ?? null,
  }));

  auftraege.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));

  return {
    ...rest,
    phone_number: phone?.number ?? null,
    phone_end_date: phone?.end_date ?? null,
    phone_order_booking_id: phone?.order_booking_id ? Number(phone.order_booking_id) : null,
    auftraege,
  } as WorkItem;
}

export const listWorkItems = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<WorkItem[]> => {
    const { data, error } = await context.supabase
      .from("vics")
      .select(SELECT_COLUMNS)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });

    if (error) throw new Error("Aufträge konnten nicht geladen werden.");
    return ((data ?? []) as any[])
      .map(mapItem)
      .filter((item) => item.auftraege.length > 0);
  });

export const getWorkItem = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ vic_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<WorkItem> => {
    const { data: row, error } = await context.supabase
      .from("vics")
      .select(SELECT_COLUMNS)
      .eq("id", data.vic_id)
      .maybeSingle();

    if (error || !row) throw new Error("Datensatz konnte nicht geladen werden.");
    return mapItem(row);
  });

export const claimVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ vic_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: current, error: readError } = await context.supabase
      .from("vics")
      .select("claimed_by")
      .eq("id", data.vic_id)
      .maybeSingle();

    if (readError || !current) throw new Error("Datensatz konnte nicht geladen werden.");
    if (current.claimed_by && current.claimed_by !== context.userId) {
      throw new Error("Dieser Datensatz wurde bereits von jemand anderem beansprucht.");
    }

    const { error } = await context.supabase
      .from("vics")
      .update({ claimed_by: context.userId, claimed_at: new Date().toISOString() })
      .eq("id", data.vic_id)
      .is("claimed_by", null);

    if (error) throw new Error("Datensatz konnte nicht beansprucht werden.");
    return { ok: true };
  });

async function assertClaimed(
  supabase: any,
  vicId: string,
  userId: string,
  options: { allowCompleted?: boolean } = {},
) {
  const { data, error } = await supabase
    .from("vics")
    .select("claimed_by, birth_date, completed_at")
    .eq("id", vicId)
    .maybeSingle();

  if (error || !data) throw new Error("Datensatz konnte nicht geladen werden.");
  if (data.claimed_by !== userId) {
    throw new Error("Dieser Datensatz ist dir nicht zugewiesen.");
  }
  if (!options.allowCompleted && data.completed_at) {
    throw new Error("Dieser Datensatz ist bereits abgeschlossen und kann nicht mehr geändert werden.");
  }
  return data as { claimed_by: string; birth_date: string | null; completed_at: string | null };
}

export const ensureEmailIdentity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ vic_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<WorkItem> => {
    const vic = await assertClaimed(context.supabase, data.vic_id, context.userId);

    const { data: existing } = await context.supabase
      .from("vics")
      .select("email_street, email_birth_date")
      .eq("id", data.vic_id)
      .maybeSingle();

    if (!existing?.email_street || !existing?.email_birth_date) {
      const identity = generateEmailIdentity(vic.birth_date);
      const { error } = await context.supabase
        .from("vics")
        .update({
          claimed_by: context.userId,
          email_street: identity.street,
          email_postal_code: identity.postal_code,
          email_city: identity.city,
          email_birth_date: identity.birth_date,
        })
        .eq("id", data.vic_id);

      if (error) throw new Error("Daten konnten nicht erzeugt werden.");
    }

    return getWorkItemInternal(context.supabase, data.vic_id);
  });

async function getWorkItemInternal(supabase: any, vicId: string): Promise<WorkItem> {
  const { data: row, error } = await supabase
    .from("vics")
    .select(SELECT_COLUMNS)
    .eq("id", vicId)
    .maybeSingle();

  if (error || !row) throw new Error("Datensatz konnte nicht geladen werden.");
  return mapItem(row);
}

export const saveEmailAddress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        vic_id: z.string().uuid(),
        email_address: z.string().trim().email("Bitte eine gültige E-Mail eingeben.").max(200),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<WorkItem> => {
    await assertClaimed(context.supabase, data.vic_id, context.userId);

    const { error } = await context.supabase
      .from("vics")
      .update({ claimed_by: context.userId, email_address: data.email_address })
      .eq("id", data.vic_id);

    if (error) throw new Error("E-Mail-Adresse konnte nicht gespeichert werden.");
    return getWorkItemInternal(context.supabase, data.vic_id);
  });

export const completeAuftrag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        vic_id: z.string().uuid(),
        auftrag_id: z.string().uuid(),
        status: z.enum(["offen", "erfolgreich", "fehlgeschlagen"]),
        used_login_name: z.string().trim().max(200).nullable().optional(),
        used_password: z.string().trim().max(200).nullable().optional(),
        webid_link: z.string().trim().max(1000).nullable().optional(),
        postident_link: z.string().trim().max(1000).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }): Promise<WorkItem> => {
    await assertClaimed(context.supabase, data.vic_id, context.userId);

    const { error } = await context.supabase
      .from("vic_auftraege")
      .update({
        status: data.status,
        used_login_name: data.used_login_name || null,
        used_password: data.used_password || null,
        webid_link: data.webid_link || null,
        postident_link: data.postident_link || null,
        completed_at: data.status === "offen" ? null : new Date().toISOString(),
        completed_by: data.status === "offen" ? null : context.userId,
      })
      .eq("vic_id", data.vic_id)
      .eq("auftrag_id", data.auftrag_id);

    if (error) throw new Error("Auftrag konnte nicht gespeichert werden.");
    return getWorkItemInternal(context.supabase, data.vic_id);
  });

export const finishVic = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ vic_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<WorkItem> => {
    await assertClaimed(context.supabase, data.vic_id, context.userId);

    const { data: open, error: openError } = await context.supabase
      .from("vic_auftraege")
      .select("id")
      .eq("vic_id", data.vic_id)
      .eq("status", "offen");

    if (openError) throw new Error("Aufträge konnten nicht geprüft werden.");
    if ((open ?? []).length > 0) {
      throw new Error("Es sind noch Aufträge offen.");
    }

    const { error } = await context.supabase
      .from("vics")
      .update({
        claimed_by: context.userId,
        completed_at: new Date().toISOString(),
        completed_by: context.userId,
      })
      .eq("id", data.vic_id);

    if (error) throw new Error("Datensatz konnte nicht abgeschlossen werden.");
    return getWorkItemInternal(context.supabase, data.vic_id);
  });

export type VicSmsRow = {
  messageDate: string;
  messageSender: string;
  messageText: string;
};

export const listVicSms = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ vic_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<VicSmsRow[]> => {
    const { data: vic, error: vicError } = await context.supabase
      .from("vics")
      .select("claimed_by")
      .eq("id", data.vic_id)
      .maybeSingle();

    if (vicError || !vic) throw new Error("Datensatz konnte nicht geladen werden.");

    if (vic.claimed_by !== context.userId) {
      const { data: isAdmin } = await context.supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", context.userId)
        .eq("role", "admin")
        .maybeSingle();
      if (!isAdmin) throw new Error("Kein Zugriff auf diese Telefonnummer.");
    }

    const { data: number } = await context.supabase
      .from("anosim_numbers")
      .select("order_booking_id")
      .eq("vic_id", data.vic_id)
      .maybeSingle();

    if (!number?.order_booking_id) return [];

    const { anosimFetch, AnosimError } = await import("./anosim.server");
    try {
      const sms = await anosimFetch<import("./anosim.server").AnosimSms[]>(
        `/Sms/${Number(number.order_booking_id)}`,
      );
      return (Array.isArray(sms) ? sms : []).map((item) => ({
        messageDate: item.messageDate,
        messageSender: item.messageSender,
        messageText: item.messageText,
      }));
    } catch (err) {
      if (err instanceof AnosimError && err.status === 400) return [];
      throw err;
    }
  });
