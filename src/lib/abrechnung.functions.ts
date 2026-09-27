import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const RATE_SUCCESS_CENTS = 500;
const RATE_FAILED_CENTS = 250;

export type AbrechnungEntry = {
  id: string;
  date: string;
  auftrag_name: string;
  logo_path: string | null;
  vic_name: string;
  result: "erfolgreich" | "fehlgeschlagen";
  amount_cents: number;
};

export type Abrechnung = {
  balance_cents: number;
  success_count: number;
  failed_count: number;
  entries: AbrechnungEntry[];
};

export type AdminAbrechnungMitarbeiter = Abrechnung & {
  user_id: string;
  name: string;
  email: string;
};

export type AdminAbrechnung = {
  total_cents: number;
  success_count: number;
  failed_count: number;
  mitarbeiter: AdminAbrechnungMitarbeiter[];
};

export const getAdminAbrechnung = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminAbrechnung> => {
    const { data: roleRow } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Kein Zugriff.");

    const [auftraegeRes, rolesRes, profilesRes] = await Promise.all([
      context.supabase
        .from("vic_auftraege")
        .select(
          "id, status, internal_mark, completed_at, updated_at, auftraege(name, logo_path, admin_only), vics!inner(first_name, last_name, claimed_by)",
        )
        .not("vics.claimed_by", "is", null),
      context.supabase.from("user_roles").select("user_id").eq("role", "mitarbeiter"),
      context.supabase.from("profiles").select("user_id, first_name, last_name, email"),
    ]);

    if (auftraegeRes.error || rolesRes.error || profilesRes.error) {
      throw new Error("Abrechnung konnte nicht geladen werden.");
    }

    const profileByUser = new Map<string, { first_name: string; last_name: string; email: string }>();
    for (const p of (profilesRes.data ?? []) as any[]) {
      profileByUser.set(p.user_id, p);
    }

    const byUser = new Map<string, AdminAbrechnungMitarbeiter>();
    for (const r of (rolesRes.data ?? []) as any[]) {
      const profile = profileByUser.get(r.user_id);
      const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
      byUser.set(r.user_id, {
        user_id: r.user_id,
        name: name || profile?.email || "Mitarbeiter",
        email: profile?.email ?? "",
        balance_cents: 0,
        success_count: 0,
        failed_count: 0,
        entries: [],
      });
    }

    let total = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const row of (auftraegeRes.data ?? []) as any[]) {
      if (row.auftraege?.admin_only) continue;

      let result: "erfolgreich" | "fehlgeschlagen" | null = null;
      if (row.internal_mark) result = "erfolgreich";
      else if (row.status === "erfolgreich") result = "erfolgreich";
      else if (row.status === "fehlgeschlagen") result = "fehlgeschlagen";
      if (!result) continue;

      const userId = row.vics?.claimed_by as string | null;
      if (!userId) continue;
      if (!byUser.has(userId)) {
        const profile = profileByUser.get(userId);
        const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
        byUser.set(userId, {
          user_id: userId,
          name: name || profile?.email || "Mitarbeiter",
          email: profile?.email ?? "",
          balance_cents: 0,
          success_count: 0,
          failed_count: 0,
          entries: [],
        });
      }
      const bucket = byUser.get(userId)!;

      const amount = result === "erfolgreich" ? RATE_SUCCESS_CENTS : RATE_FAILED_CENTS;
      bucket.balance_cents += amount;
      total += amount;
      if (result === "erfolgreich") {
        bucket.success_count += 1;
        successCount += 1;
      } else {
        bucket.failed_count += 1;
        failedCount += 1;
      }

      bucket.entries.push({
        id: row.id,
        date: row.completed_at ?? row.updated_at,
        auftrag_name: row.auftraege?.name ?? "",
        logo_path: row.auftraege?.logo_path ?? null,
        vic_name: `${row.vics?.first_name ?? ""} ${row.vics?.last_name ?? ""}`.trim(),
        result,
        amount_cents: amount,
      });
    }

    const mitarbeiter = [...byUser.values()];
    for (const m of mitarbeiter) {
      m.entries.sort((a, b) => b.date.localeCompare(a.date));
    }
    mitarbeiter.sort((a, b) => b.balance_cents - a.balance_cents || a.name.localeCompare(b.name));

    return {
      total_cents: total,
      success_count: successCount,
      failed_count: failedCount,
      mitarbeiter,
    };
  });

export const getMyAbrechnung = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Abrechnung> => {
    const { data, error } = await context.supabase
      .from("vic_auftraege")
      .select(
        "id, status, internal_mark, completed_at, updated_at, auftraege(name, logo_path, admin_only), vics!inner(first_name, last_name, claimed_by)",
      )
      .eq("vics.claimed_by", context.userId);

    if (error) throw new Error("Abrechnung konnte nicht geladen werden.");

    const entries: AbrechnungEntry[] = [];
    let balance = 0;
    let successCount = 0;
    let failedCount = 0;

    for (const row of (data ?? []) as any[]) {
      if (row.auftraege?.admin_only) continue;

      let result: "erfolgreich" | "fehlgeschlagen" | null = null;
      if (row.internal_mark) result = "erfolgreich";
      else if (row.status === "erfolgreich") result = "erfolgreich";
      else if (row.status === "fehlgeschlagen") result = "fehlgeschlagen";
      if (!result) continue;

      const amount = result === "erfolgreich" ? RATE_SUCCESS_CENTS : RATE_FAILED_CENTS;
      balance += amount;
      if (result === "erfolgreich") successCount += 1;
      else failedCount += 1;

      entries.push({
        id: row.id,
        date: row.completed_at ?? row.updated_at,
        auftrag_name: row.auftraege?.name ?? "",
        logo_path: row.auftraege?.logo_path ?? null,
        vic_name: `${row.vics?.first_name ?? ""} ${row.vics?.last_name ?? ""}`.trim(),
        result,
        amount_cents: amount,
      });
    }

    entries.sort((a, b) => b.date.localeCompare(a.date));

    return {
      balance_cents: balance,
      success_count: successCount,
      failed_count: failedCount,
      entries,
    };
  });
