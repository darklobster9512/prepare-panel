import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  paths: z.array(z.string().min(1)).min(1).max(50),
});

/** Erzeugt serverseitig signierte Links für Logos und Screenshots der Auftragsvorlagen. */
export const getAuftragFileUrls = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => schema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: signed, error } = await supabaseAdmin.storage
      .from("auftrag-logos")
      .createSignedUrls(data.paths, 60 * 60);

    if (error) {
      throw new Error("Die Bilder konnten nicht geladen werden.");
    }

    const result: Record<string, string> = {};
    for (const entry of signed ?? []) {
      if (entry.path && entry.signedUrl) result[entry.path] = entry.signedUrl;
    }
    return result;
  });
