import { Download, FileText, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

const BUCKET = "postident-pdfs";
const MAX_BYTES = 20 * 1024 * 1024;

export function PostidentPdf({
  vicId,
  vicAuftragId,
  path,
  name,
  editable,
  onChanged,
}: {
  vicId: string;
  vicAuftragId: string;
  path: string | null | undefined;
  name: string | null | undefined;
  editable: boolean;
  onChanged: (next: { path: string | null; name: string | null }) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async (nextPath: string | null, nextName: string | null) => {
    const { error: updateError } = await supabase
      .from("vic_auftraege")
      .update({ postident_pdf_path: nextPath, postident_pdf_name: nextName })
      .eq("id", vicAuftragId);
    if (updateError) throw new Error("PDF konnte nicht gespeichert werden.");
    onChanged({ path: nextPath, name: nextName });
  };

  const upload = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Bitte eine PDF-Datei wählen.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Die Datei ist größer als 20 MB.");
      return;
    }
    setBusy(true);
    try {
      const target = `${vicId}/${vicAuftragId}.pdf`;
      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(target, file, { upsert: true, contentType: "application/pdf" });
      if (uploadError) throw new Error("PDF konnte nicht hochgeladen werden.");
      await save(target, file.name.slice(0, 200));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload fehlgeschlagen.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const open = async () => {
    if (!path) return;
    setError(null);
    const { data, error: signError } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(path, 300, { download: name ?? "postident.pdf" });
    if (signError || !data) {
      setError("PDF konnte nicht geladen werden.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const remove = async () => {
    if (!path) return;
    setBusy(true);
    setError(null);
    try {
      await supabase.storage.from(BUCKET).remove([path]);
      await save(null, null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF konnte nicht entfernt werden.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Postident-PDF</p>
      {path ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate">{name ?? "postident.pdf"}</span>
          <button
            type="button"
            onClick={open}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90"
          >
            <Download className="h-3.5 w-3.5" /> PDF herunterladen
          </button>
          {editable ? (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs font-semibold text-muted-foreground hover:text-destructive disabled:opacity-60"
            >
              <Trash2 className="h-3.5 w-3.5" /> Entfernen
            </button>
          ) : null}
        </div>
      ) : !editable ? (
        <p className="text-sm text-muted-foreground">Kein PDF hochgeladen.</p>
      ) : null}
      {editable ? (
        <>
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary disabled:opacity-60"
          >
            <Upload className="h-4 w-4" />
            {busy ? "Wird hochgeladen…" : path ? "PDF ersetzen" : "PDF hochladen"}
          </button>
        </>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
