import { createFileRoute } from "@tanstack/react-router";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

const REQUIRED: Record<string, string> = {
  first_name: "Vorname(n)",
  last_name: "Nachname",
  birth_date: "Geburtsdatum",
  birth_place: "Geburtsort",
  street: "Straße und Hausnummer",
  postal_code: "PLZ",
  city: "Ort",
  project: "Projekt",
};
const OPTIONAL = ["birth_name", "marital_status", "tax_id", "bank"];

function str(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s ? s.slice(0, 200) : null;
}

export function parseImportDate(v: string): string | null {
  let m = v.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  let y: number, mo: number, d: number;
  if (m) [d, mo, y] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else if ((m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/)))
    [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export const Route = createFileRoute("/api/public/vics")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { headers: cors }),
      POST: async ({ request }) => {
        let body: any;
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "Ungültiges JSON." }, 400);
        }

        const input: any[] = Array.isArray(body?.records)
          ? body.records
          : Array.isArray(body)
            ? body
            : [body];
        if (input.length === 0) return json({ ok: false, error: "Keine Datensätze." }, 400);
        if (input.length > 20)
          return json({ ok: false, error: "Maximal 20 Datensätze pro Aufruf." }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: projects, error: pErr } = await supabaseAdmin
          .from("projects")
          .select("id, name");
        if (pErr) return json({ ok: false, error: "Projekte konnten nicht geladen werden." }, 500);
        const projectMap = new Map(
          (projects ?? []).map((p) => [p.name.trim().toLowerCase(), p.id]),
        );

        const { data: templates, error: tErr } = await supabaseAdmin
          .from("auftraege")
          .select("id, name, ident_type, admin_only");
        if (tErr) return json({ ok: false, error: "Aufträge konnten nicht geladen werden." }, 500);
        const { matchAuftraege } = await import("@/lib/auftrag-match");
        const auftragIds: string[][] = [];

        const errors: { index: number; errors: string[] }[] = [];
        const rows: any[] = [];

        input.forEach((rec, index) => {
          if (!rec || typeof rec !== "object") {
            errors.push({ index, errors: ["Datensatz ist kein Objekt."] });
            return;
          }
          const errs: string[] = [];
          const row: any = { created_by: null };
          for (const [key, label] of Object.entries(REQUIRED)) {
            const v = str(rec[key]);
            if (!v) errs.push(`${label} fehlt.`);
            else row[key] = v;
          }
          for (const key of OPTIONAL) row[key] = str(rec[key]);
          row.request_id = str(rec.request_id) ?? str(body?.request_id);
          if (typeof row.birth_date === "string") {
            const d = parseImportDate(row.birth_date);
            if (!d) errs.push("Geburtsdatum ungültig (TT.MM.JJJJ oder JJJJ-MM-TT).");
            else row.birth_date = d;
          }
          if (typeof row.project === "string") {
            const id = projectMap.get(row.project.toLowerCase());
            if (!id) errs.push(`Projekt „${row.project}" existiert nicht.`);
            row.project_id = id ?? null;
          }
          delete row.project;
          const matched = matchAuftraege(rec.auftraege, (templates ?? []) as any);
          errs.push(...matched.errors);
          auftragIds.push(matched.ids);
          if (errs.length) errors.push({ index, errors: errs });
          else rows.push(row);
        });

        if (errors.length) return json({ ok: false, errors }, 400);

        const { buildCredentials } = await import("@/lib/vic-auftraege.server");
        const nameById = new Map((templates ?? []).map((t) => [t.id, t.name]));
        let product: { productId: number } | null = null;
        let productError: string | null = null;
        const results: any[] = [];

        const { isSameVic } = await import("@/lib/auftrag-match");
        for (let i = 0; i < rows.length; i += 1) {
          let vic: { id: string; first_name: string; last_name: string } | null = null;
          let existing = false;
          const { data: candidates } = await supabaseAdmin
            .from("vics")
            .select("id, first_name, last_name, birth_date, completed_at")
            .eq("birth_date", rows[i].birth_date);
          const found = (candidates ?? []).find((c) => isSameVic(c, rows[i]));
          if (found) {
            vic = found;
            existing = true;
            if (rows[i].request_id) {
              await supabaseAdmin
                .from("vics")
                .update({ request_id: rows[i].request_id } as any)
                .eq("id", found.id);
            }
          } else {
            const { data: inserted, error } = await supabaseAdmin
              .from("vics")
              .insert(rows[i])
              .select("id, first_name, last_name")
              .single();
            if (error || !inserted) {
              console.error("[import-vics]", error?.message);
              results.push({ ok: false, error: "Datensatz konnte nicht gespeichert werden." });
              continue;
            }
            vic = inserted;
          }

          const { data: have } = await supabaseAdmin
            .from("vic_auftraege")
            .select("auftrag_id")
            .eq("vic_id", vic.id);
          const haveIds = new Set((have ?? []).map((h) => h.auftrag_id));
          const skipped: string[] = [];
          const assigned: string[] = [];
          for (const auftragId of auftragIds[i] ?? []) {
            if (haveIds.has(auftragId)) {
              skipped.push(nameById.get(auftragId) ?? auftragId);
              continue;
            }
            try {
              const c = await buildCredentials(supabaseAdmin, vic.id, auftragId);
              const { error: aErr } = await supabaseAdmin.from("vic_auftraege").insert({
                vic_id: vic.id,
                auftrag_id: auftragId,
                login_name: c.login_name,
                password: c.password,
                created_by: null,
              });
              if (!aErr) assigned.push(nameById.get(auftragId) ?? auftragId);
              else console.error("[import-vics] Auftrag", aErr.message);
            } catch (err) {
              console.error("[import-vics] Auftrag", err);
            }
          }

          if (existing && assigned.length > 0 && found?.completed_at) {
            await supabaseAdmin
              .from("vics")
              .update({ completed_at: null, completed_by: null })
              .eq("id", vic.id);
          }

          let number: string | null = null;
          let numberError: string | null = null;
          const { data: owned } = await supabaseAdmin
            .from("anosim_numbers")
            .select("number")
            .eq("vic_id", vic.id)
            .limit(1);
          if (owned && owned.length > 0) {
            number = owned[0]!.number ?? null;
          } else
          try {
            const { findFullServiceProduct, purchaseNumber } = await import(
              "@/lib/anosim-purchase.server"
            );
            if (!product && !productError) {
              try {
                product = await findFullServiceProduct();
              } catch (err) {
                productError = err instanceof Error ? err.message : "Kein Produkt verfügbar.";
              }
            }
            if (!product) throw new Error(productError ?? "Kein Produkt verfügbar.");
            const numbers = await purchaseNumber(supabaseAdmin, product.productId, vic.id, null);
            number = numbers[0] ?? null;
          } catch (err) {
            console.error("[import-vics] Nummernkauf", err);
            numberError = "Nummer konnte nicht gekauft werden.";
          }

          if (assigned.length > 0) {
            try {
              const { data: recipients } = await supabaseAdmin
                .from("telegram_recipients")
                .select("chat_id")
                .eq("active", true);
              const chatIds = (recipients ?? []).map((r) => r.chat_id);
              if (chatIds.length > 0) {
                const { broadcastTelegramMessage, buildNewAuftraegeMessage } = await import(
                  "@/lib/telegram.server"
                );
                await broadcastTelegramMessage(
                  chatIds,
                  buildNewAuftraegeMessage({
                    vicName: `${vic.first_name} ${vic.last_name}`.trim(),
                    auftragNames: assigned,
                  }),
                );
              }
            } catch (err) {
              console.error("[import-vics] Telegram", err);
            }
          }

          results.push({
            ok: true,
            vic_id: vic.id,
            request_id: rows[i].request_id ?? null,
            existing,
            number,
            ...(numberError ? { number_error: numberError } : {}),
            auftraege: assigned,
            skipped,
          });
        }

        return json({ ok: results.every((r) => r.ok), count: results.length, results }, 201);
      },
    },
  },
});
