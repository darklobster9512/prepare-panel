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
        if (input.length > 200)
          return json({ ok: false, error: "Maximal 200 Datensätze pro Aufruf." }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: projects, error: pErr } = await supabaseAdmin
          .from("projects")
          .select("id, name");
        if (pErr) return json({ ok: false, error: "Projekte konnten nicht geladen werden." }, 500);
        const projectMap = new Map(
          (projects ?? []).map((p) => [p.name.trim().toLowerCase(), p.id]),
        );

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
          if (errs.length) errors.push({ index, errors: errs });
          else rows.push(row);
        });

        if (errors.length) return json({ ok: false, errors }, 400);

        const { error } = await supabaseAdmin.from("vics").insert(rows);
        if (error) {
          console.error("[import-vics]", error.message);
          return json({ ok: false, error: "Datensätze konnten nicht gespeichert werden." }, 500);
        }
        return json({ ok: true, count: rows.length }, 201);
      },
    },
  },
});
