import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, ImageIcon, Pencil, Plus, Trash2, X } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  createAuftrag,
  deleteAuftrag,
  listAuftraege,
  updateAuftrag,
  type AuftragRow,
  type IdentType,
} from "@/lib/auftraege.functions";

type Props = { enabled: boolean };

const IDENT_LABELS: Record<IdentType, string> = {
  videoident: "Videoident",
  postident: "Postident",
  email: "E-Mail",
};

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
  const [identType, setIdentType] = useState<IdentType | "">("");
  const [besonderheiten, setBesonderheiten] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [generatePassword, setGeneratePassword] = useState(false);
  const [adminOnly, setAdminOnly] = useState(false);
  const [generateLoginname, setGenerateLoginname] = useState(false);
  const [sortOrder, setSortOrder] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    const urls = newImages.map((file) => URL.createObjectURL(file));
    setNewImagePreviews(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [newImages]);

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
    setIdentType("");
    setBesonderheiten("");
    setImages([]);
    setNewImages([]);
    setGeneratePassword(false);
    setGenerateLoginname(false);
    setAdminOnly(false);
    setSortOrder("100");
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
    setIdentType(auftrag.ident_type ?? "");
    setBesonderheiten(auftrag.besonderheiten ?? "");
    setImages(auftrag.images ?? []);
    setNewImages([]);
    setGeneratePassword(auftrag.generate_password ?? false);
    setGenerateLoginname(auftrag.generate_loginname ?? false);
    setAdminOnly(auftrag.admin_only ?? false);
    setSortOrder(String(auftrag.sort_order ?? 100));
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

      const imagePaths = [...images];
      for (const file of newImages) {
        const ext = file.name.split(".").pop() ?? "png";
        const target = `bilder/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(AUFTRAG_LOGO_BUCKET)
          .upload(target, file, { contentType: file.type });
        if (uploadError) {
          setError("Ein Bild konnte nicht hochgeladen werden.");
          setSaving(false);
          return;
        }
        imagePaths.push(target);
      }

      const payload = {
        name: name.trim(),
        logo_path: path,
        ident_type: identType === "" ? null : identType,
        besonderheiten: besonderheiten.trim() ? besonderheiten.trim() : null,
        images: imagePaths,
        generate_password: generatePassword,
        generate_loginname: generateLoginname,
        admin_only: adminOnly,
        sort_order: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 100,
      };

      if (editing) {
        await editAuftrag({ data: { id: editing.id, ...payload } });
      } else {
        await addAuftrag({ data: payload });
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
          Auftragsvorlagen mit Logo, Ident-Art und Besonderheiten anlegen.
        </p>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-10">
        {auftraege.map((auftrag) => (
          <div
            key={auftrag.id}
            className="group relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border border-border bg-card p-3 shadow-sm"
          >
            <AuftragLogo
              value={auftrag.logo_path}
              alt={auftrag.name}
              className="h-10 w-10 rounded-lg border border-border object-contain"
              fallback={
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground">
                  <ImageIcon className="h-4 w-4" aria-hidden="true" />
                </div>
              }
            />
            <span className="line-clamp-2 text-center text-xs font-semibold text-foreground">
              {auftrag.name}
            </span>
            {auftrag.ident_type ? (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                {IDENT_LABELS[auftrag.ident_type]}
              </span>
            ) : null}

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
          className="flex aspect-square flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-card/50 p-3 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          <span className="text-center text-xs font-semibold">Auftrag hinzufügen</span>
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
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Auftrag bearbeiten" : "Neuer Auftrag"}</DialogTitle>
            <DialogDescription>
              Logo, Name und weitere Infos zum Auftrag hinterlegen.
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

            <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-3">
              <div className="space-y-1">
                <Label htmlFor="auftrag-intern">Nur intern (Admin)</Label>
                <p className="text-xs text-muted-foreground">
                  Mitarbeiter sehen diesen Auftrag nicht. Er gilt beim Zuweisen sofort
                  als erledigt, Passwort-Muster: Vorname + Jahr + „!" (z. B. Stefan2026!).
                </p>
              </div>
              <Switch id="auftrag-intern" checked={adminOnly} onCheckedChange={setAdminOnly} />
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

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">Ident-Art</legend>
              <div className="flex flex-wrap gap-2">
                {(["videoident", "postident", "email"] as IdentType[]).map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      identType === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="ident-type"
                      value={value}
                      checked={identType === value}
                      onChange={() => setIdentType(value)}
                      className="h-4 w-4 accent-[var(--primary)]"
                    />
                    {IDENT_LABELS[value]}
                  </label>
                ))}
                {identType ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="rounded-full"
                    onClick={() => setIdentType("")}
                  >
                    Auswahl entfernen
                  </Button>
                ) : null}
              </div>
            </fieldset>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-3">
              <div className="space-y-1">
                <Label htmlFor="auftrag-passwort">Passwort generieren</Label>
                <p className="text-xs text-muted-foreground">
                  Muster: Vorname + 6 zufällige Ziffern (z. B. Stefan856102).
                </p>
              </div>
              <Switch
                id="auftrag-passwort"
                checked={generatePassword}
                onCheckedChange={setGeneratePassword}
              />
            </div>

            <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/40 p-3">
              <div className="space-y-1">
                <Label htmlFor="auftrag-loginname">Anmeldename generieren</Label>
                <p className="text-xs text-muted-foreground">
                  Muster: Nachname + Geburtsjahr (z. B. Ehses66), mindestens 8 Zeichen –
                  bei kurzen Namen volles Jahr (z. B. Melz1966).
                </p>
              </div>
              <Switch
                id="auftrag-loginname"
                checked={generateLoginname}
                onCheckedChange={setGenerateLoginname}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auftrag-sortorder">Reihenfolge</Label>
              <p className="text-xs text-muted-foreground">
                Kleinere Zahl = früher im Ablauf der Mitarbeitenden (E-Mail 10, DKB 20,
                Deutsche Bank 30, BBVA 40, Consorsbank 50, Commerzbank 60, Targobank 70,
                Santander 80).
              </p>
              <Input
                id="auftrag-sortorder"
                type="number"
                min={0}
                max={9999}
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auftrag-besonderheiten">Besonderheiten</Label>
              <Textarea
                id="auftrag-besonderheiten"
                value={besonderheiten}
                onChange={(event) => setBesonderheiten(event.target.value)}
                placeholder="Hinweise zum Auftrag …"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="auftrag-bilder">Bilder</Label>
              <Input
                id="auftrag-bilder"
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  if (files.length) setNewImages((prev) => [...prev, ...files]);
                  event.target.value = "";
                }}
              />

              {images.length || newImagePreviews.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {images.map((path) => (
                    <div
                      key={path}
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <AuftragLogo
                        value={path}
                        alt="Bild"
                        className="h-full w-full object-cover"
                        fallback={
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                          </div>
                        }
                      />
                      <button
                        type="button"
                        aria-label="Bild entfernen"
                        onClick={() => setImages((prev) => prev.filter((p) => p !== path))}
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow-sm"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}

                  {newImagePreviews.map((url, index) => (
                    <div
                      key={url}
                      className="relative h-20 w-20 overflow-hidden rounded-lg border border-dashed border-border bg-muted"
                    >
                      <img src={url} alt="Neues Bild" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Bild entfernen"
                        onClick={() =>
                          setNewImages((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="absolute right-1 top-1 rounded-full bg-background/90 p-1 text-destructive shadow-sm"
                      >
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
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
