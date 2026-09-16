import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ImageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { AUFTRAG_LOGO_BUCKET, AuftragLogo } from "@/components/auftrag-logo";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import {
  createAuftrag,
  deleteAuftrag,
  listAuftraege,
  updateAuftrag,
  type AuftragRow,
} from "@/lib/auftraege.functions";

type Props = { enabled: boolean };

export function AuftraegeSection({ enabled }: Props) {
  const queryClient = useQueryClient();
  const fetchAuftraege = useServerFn(listAuftraege);
  const addAuftrag = useServerFn(createAuftrag);
  const editAuftrag = useServerFn(updateAuftrag);
  const removeAuftrag = useServerFn(deleteAuftrag);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AuftragRow | null>(null);
  const [name, setName] = useState("");
  const [logoPath, setLogoPath] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const auftraegeQuery = useQuery({
    queryKey: ["admin", "auftraege"],
    queryFn: () => fetchAuftraege(),
    enabled,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "auftraege"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeAuftrag({ data: { id } }),
    onSuccess: () => invalidate(),
    onError: () => setError("Auftrag konnte nicht gelöscht werden."),
  });

  const resetForm = () => {
    setEditing(null);
    setName("");
    setLogoPath(null);
    setLogoFile(null);
    setPreview(null);
    setError(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (auftrag: AuftragRow) => {
    setEditing(auftrag);
    setName(auftrag.name);
    setLogoPath(auftrag.logo_path);
    setLogoFile(null);
    setPreview(null);
    setError(null);
    setOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Bitte einen Namen eingeben.");
      return;
    }

    setSaving(true);
    try {
      let path = logoPath;

      if (logoFile) {
        const ext = logoFile.name.split(".").pop() ?? "png";
        const target = `${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(AUFTRAG_LOGO_BUCKET)
          .upload(target, logoFile, { contentType: logoFile.type });
        if (uploadError) {
          setError("Logo konnte nicht hochgeladen werden.");
          setSaving(false);
          return;
        }
        path = target;
      }

      if (editing) {
        await editAuftrag({ data: { id: editing.id, name: name.trim(), logo_path: path } });
      } else {
        await addAuftrag({ data: { name: name.trim(), logo_path: path } });
      }

      setOpen(false);
      resetForm();
      await invalidate();
    } catch {
      setError("Auftrag konnte nicht gespeichert werden. Bitte erneut versuchen.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (auftrag: AuftragRow) => {
    if (!window.confirm(`Auftrag „${auftrag.name}" wirklich löschen?`)) return;
    deleteMutation.mutate(auftrag.id);
  };

  const auftraege = auftraegeQuery.data ?? [];

  return (
    <section>
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">Aufträge</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Auftragsvorlagen mit Logo und Name anlegen.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {auftraege.map((auftrag) => (
          <div
            key={auftrag.id}
            className="group relative flex min-h-[9.5rem] flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <AuftragLogo
              value={auftrag.logo_path}
              alt={auftrag.name}
              className="h-12 w-12 rounded-xl border border-border object-contain"
              fallback={
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                  <ImageIcon className="h-5 w-5" aria-hidden="true" />
                </div>
              }
            />
            <span className="mt-auto line-clamp-2 text-sm font-semibold text-foreground">
              {auftrag.name}
            </span>

            <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => openEdit(auftrag)}
                aria-label={`${auftrag.name} bearbeiten`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-destructive"
                onClick={() => handleDelete(auftrag)}
                aria-label={`${auftrag.name} löschen`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={openCreate}
          className="flex min-h-[9.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-7 w-7" aria-hidden="true" />
          <span className="text-sm font-semibold">Auftrag hinzufügen</span>
        </button>
      </div>

      {error && !open ? (
        <p className="mt-3 flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={(value) => {
          setOpen(value);
          if (!value) resetForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Auftrag bearbeiten" : "Neuer Auftrag"}</DialogTitle>
            <DialogDescription>
              Logo hochladen und einen Namen vergeben.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border border-border bg-muted">
                {preview ? (
                  <img src={preview} alt="Vorschau" className="h-full w-full object-contain" />
                ) : (
                  <AuftragLogo
                    value={logoPath}
                    alt="Vorschau"
                    className="h-full w-full object-contain"
                    fallback={<ImageIcon className="h-5 w-5 text-muted-foreground" />}
                  />
                )}
              </div>
              <div className="flex-1 space-y-2">
                <Label htmlFor="auftrag-logo">Logo / Icon</Label>
                <Input
                  id="auftrag-logo"
                  type="file"
                  accept="image/*"
                  onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="auftrag-name">Name</Label>
              <Input
                id="auftrag-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="z. B. LIMEX"
              />
            </div>

            {error ? (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
              >
                Abbrechen
              </Button>
              <Button type="submit" disabled={saving} className="rounded-full">
                {saving ? "Speichern …" : "Speichern"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
