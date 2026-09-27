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
