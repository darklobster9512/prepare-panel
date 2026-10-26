import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { normalizeBank } from "@/lib/auftrag-match";

const TARGET = "https://pcfmaslrlferrnoopgqn.supabase.co/functions/v1/prepare-results";

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(bin);
}

export function sourceNameFor(name: string, identType: string | null): string {
  const bank = name.split(/\s+[—–-]\s+/)[0]!.replace(/\s+/g, "");
  const ident = identType === "postident" ? "postident" : "videoident";
  return `${bank}-${ident}`;
}

async function ensureShareLink(vicId: string): Promise<string | null> {
  const { data: row } = await supabaseAdmin
    .from("anosim_numbers")
    .select("order_booking_id, share_link")
    .eq("vic_id", vicId)
    .maybeSingle();
  if (!row) return null;
  if (row.share_link) return row.share_link;
  const id = Number(row.order_booking_id);
  if (!Number.isFinite(id) || id <= 0) return null;
  const { ensureShareLinkForBooking } = await import("./anosim-purchase.server");
  return ensureShareLinkForBooking(supabaseAdmin, id);
}

/** Sendet die Ergebnisse eines abgeschlossenen Vics an das externe Panel. Wirft nie. */
export async function sendVicResults(vicId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { data: vic, error } = await supabaseAdmin
      .from("vics")
      .select(
        "id, request_id, email_address, vic_auftraege(status, internal_mark, source_name, login_name, password, used_login_name, used_password, webid_link, postident_pdf_path, postident_pdf_name, auftraege(name, ident_type, admin_only))",
      )
      .eq("id", vicId)
      .maybeSingle();
    if (error || !vic) throw new Error("Datensatz nicht gefunden.");
    if (!vic.request_id) return { ok: true };

    let anosim: string | null | undefined;
    const results: Record<string, unknown>[] = [];
    for (const a of (vic.vic_auftraege ?? []) as any[]) {
      const t = a.auftraege;
      if (!t || t.admin_only || normalizeBank(t.name) === "webde") continue;
      const auftrag: string = a.source_name || sourceNameFor(t.name, t.ident_type);
      const success = a.status === "erfolgreich" || (a.status !== "fehlgeschlagen" && !!a.internal_mark);
      if (!success) {
        results.push({ auftrag, success: false });
        continue;
      }
      const isPost = /-postident$/i.test(auftrag);
      const isBbva = normalizeBank(t.name) === "bbva";
      if (isPost) {
        const entry: Record<string, unknown> = { auftrag, success: true, pdf_base64: null, pdf_name: null };
        if (a.postident_pdf_path) {
          const { data: file } = await supabaseAdmin.storage.from("postident-pdfs").download(a.postident_pdf_path);
          if (file) {
            entry["pdf_base64"] = toBase64(await file.arrayBuffer());
            entry["pdf_name"] = a.postident_pdf_name || "postident.pdf";
          }
        }
        results.push(entry);
        continue;
      }
      if (anosim === undefined) anosim = await ensureShareLink(vicId);
      if (isBbva) {
        results.push({
          auftrag,
          success: true,
          username: a.used_login_name || a.login_name || null,
          password: a.used_password || a.password || null,
          email: vic.email_address ?? null,
          anosim_link: anosim,
        });
      } else {
        results.push({
          auftrag,
          success: true,
          email: vic.email_address ?? null,
          identlink: a.webid_link ?? null,
          anosim_link: anosim,
        });
      }
    }

    const res = await fetch(TARGET, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ request_id: vic.request_id, results }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) throw new Error(`Gegenstelle antwortete mit ${res.status}.`);
    await supabaseAdmin
      .from("vics")
      .update({ results_sent_at: new Date().toISOString(), results_error: null })
      .eq("id", vicId);
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Senden fehlgeschlagen.";
    console.error("[prepare-results]", msg);
    await supabaseAdmin.from("vics").update({ results_error: msg.slice(0, 500) }).eq("id", vicId);
    return { ok: false, error: msg };
  }
}
