import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Copy,
  ExternalLink,
  FileText,
  FolderKanban,
  IdCard,
  Landmark,
  LayoutDashboard,
  Loader2,
  Phone,
  Plus,
  Send,
  Trash2,
  Upload,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PanelShell } from "@/components/panel-shell";
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
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  BANK_DOCUMENTS_BUCKET,
  createBankAccount,
  deleteBankAccount,
  listBankAccounts,
  updateBankAccount,
  type BankAccountRow,
  type BankCredential,
  type BankDocument,
} from "@/lib/bank-accounts.functions";
import { listProjects } from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/admin/bankkonten")({
  head: () => ({
    meta: [
      { title: "Bankkonten – Admin-Panel | IdentPanel" },
      { name: "description", content: "Bankkonten mit Dokumenten und Zugangsdaten verwalten." },
      { property: "og:title", content: "Bankkonten – Admin-Panel | IdentPanel" },
      {
        property: "og:description",
        content: "Bankkonten mit Dokumenten und Zugangsdaten verwalten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminBankkonten,
});

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
  { label: "Bankkonten", icon: Landmark, to: "/admin/bankkonten" },
  { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
  { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
  { label: "Telegram", icon: Send, to: "/admin/telegram" },
  { label: "Abrechnung", icon: Wallet, to: "/admin/abrechnung" },
];

type FormState = {
  account_holder: string;
  bank: string;
  iban: string;
  project_id: string;
  letters_complete: boolean | null;
  coupled: boolean;
  vmos_device: string;
  credentials: BankCredential[];
  anosim_link: string;
  notes: string;
  documents: BankDocument[];
};

const emptyForm: FormState = {
  account_holder: "",
  bank: "",
  iban: "",
  project_id: "",
  letters_complete: null,
  coupled: false,
  vmos_device: "",
  credentials: [],
  anosim_link: "",
  notes: "",
  documents: [],
};

function toForm(row: BankAccountRow): FormState {
  return {
    account_holder: row.account_holder,
    bank: row.bank,
    iban: row.iban ?? "",
    project_id: row.project_id ?? "",
    letters_complete: row.letters_complete,
    coupled: row.coupled,
    vmos_device: row.vmos_device ?? "",
    credentials: row.credentials.map((c) => ({ ...c })),
    anosim_link: row.anosim_link ?? "",
    notes: row.notes ?? "",
    documents: [...row.documents],
  };
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("de-DE");
}

function formatIban(iban: string | null) {
  return iban ? iban.replace(/(.{4})/g, "$1 ").trim() : "–";
}

function copy(value: string) {
  navigator.clipboard.writeText(value).then(
    () => toast.success("Kopiert"),
    () => toast.error("Kopieren fehlgeschlagen"),
  );
}

function YesNo({ value }: { value: boolean | null }) {
  if (value === null) return <span className="text-muted-foreground">–</span>;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        value ? "bg-primary/12 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      {value ? "Ja" : "Nein"}
    </span>
  );
}

function DocumentItem({ doc, onRemove }: { doc: BankDocument; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const isImage = doc.type.startsWith("image/");

  useEffect(() => {
    let active = true;
    supabase.storage
      .from(BANK_DOCUMENTS_BUCKET)
      .createSignedUrl(doc.path, 60 * 60)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [doc.path]);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-border bg-background">
      <a
        href={url ?? undefined}
        target="_blank"
        rel="noreferrer"
        className="flex aspect-square items-center justify-center bg-secondary/50"
      >
        {isImage && url ? (
          <img src={url} alt={doc.name} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
        )}
      </a>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <span className="min-w-0 flex-1 truncate text-xs text-foreground" title={doc.name}>
          {doc.name}
        </span>
        {url ? (
          <a href={url} target="_blank" rel="noreferrer" aria-label="Öffnen">
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Dokument entfernen"
        className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-background/90 text-destructive shadow-sm"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function YesNoToggle({
  value,
  onChange,
  allowEmpty,
}: {
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  allowEmpty?: boolean;
}) {
  const options: Array<{ label: string; v: boolean | null }> = [
    ...(allowEmpty ? [{ label: "Offen", v: null }] : []),
    { label: "Ja", v: true },
    { label: "Nein", v: false },
  ];
  return (
    <div className="inline-flex rounded-full border border-border p-0.5">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.v)}
          aria-pressed={value === o.v}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === o.v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-secondary"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function AdminBankkonten() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchAccounts = useServerFn(listBankAccounts);
  const fetchProjects = useServerFn(listProjects);
  const addAccount = useServerFn(createBankAccount);
  const editAccount = useServerFn(updateBankAccount);
  const removeAccount = useServerFn(deleteBankAccount);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BankAccountRow | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [removedPaths, setRemovedPaths] = useState<string[]>([]);
  const [uploadedPaths, setUploadedPaths] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && role && role !== "admin") navigate({ to: "/mitarbeiter", replace: true });
  }, [loading, role, navigate]);

  const accountsQuery = useQuery({
    queryKey: ["admin", "bank-accounts"],
    queryFn: () => fetchAccounts(),
    enabled: role === "admin",
  });
  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => fetchProjects(),
    enabled: role === "admin",
  });

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        account_holder: form.account_holder,
        bank: form.bank,
        iban: form.iban,
        project_id: form.project_id || null,
        letters_complete: form.letters_complete,
        coupled: form.coupled,
        vmos_device: form.vmos_device,
        credentials: form.credentials,
        anosim_link: form.anosim_link,
        notes: form.notes,
        documents: form.documents,
      };
      if (editing) await editAccount({ data: { ...payload, id: editing.id } });
      else await addAccount({ data: payload });
      if (removedPaths.length > 0) {
        await supabase.storage.from(BANK_DOCUMENTS_BUCKET).remove(removedPaths);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Bankkonto aktualisiert." : "Bankkonto angelegt.");
      setUploadedPaths([]);
      setRemovedPaths([]);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "bank-accounts"] });
    },
    onError: (err: unknown) => {
      setError(err instanceof Error ? err.message : "Speichern fehlgeschlagen.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeAccount({ data: { id } }),
    onSuccess: () => {
      toast.success("Bankkonto gelöscht.");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "bank-accounts"] });
    },
    onError: () => toast.error("Bankkonto konnte nicht gelöscht werden."),
  });

  const discardUploads = () => {
    if (uploadedPaths.length > 0) {
      supabase.storage.from(BANK_DOCUMENTS_BUCKET).remove(uploadedPaths);
    }
    setUploadedPaths([]);
    setRemovedPaths([]);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, credentials: [] , documents: [] });
    setRemovedPaths([]);
    setUploadedPaths([]);
    setError(null);
    setOpen(true);
  };

  const openDetail = (row: BankAccountRow) => {
    setEditing(row);
    setForm(toForm(row));
    setRemovedPaths([]);
    setUploadedPaths([]);
    setError(null);
    setOpen(true);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && !saveMutation.isPending) discardUploads();
    setOpen(next);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const added: BankDocument[] = [];
    for (const file of Array.from(files)) {
      const safeName = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${crypto.randomUUID()}/${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from(BANK_DOCUMENTS_BUCKET)
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) {
        toast.error(`„${file.name}" konnte nicht hochgeladen werden.`);
        continue;
      }
      added.push({ path, name: file.name, type: file.type || "", size: file.size });
    }
    setUploadedPaths((prev) => [...prev, ...added.map((d) => d.path)]);
    setForm((prev) => ({ ...prev, documents: [...prev.documents, ...added] }));
    setUploading(false);
  };

  const removeDocument = (doc: BankDocument) => {
    setForm((prev) => ({ ...prev, documents: prev.documents.filter((d) => d.path !== doc.path) }));
    setRemovedPaths((prev) => [...prev, doc.path]);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.account_holder.trim()) return setError("Bitte den Kontoinhaber eingeben.");
    if (!form.bank.trim()) return setError("Bitte die Bank eingeben.");
    saveMutation.mutate();
  };

  const accounts = accountsQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase().replace(/\s+/g, "");
    if (!term) return accounts;
    return accounts.filter((a) =>
      [a.account_holder, a.bank, a.iban ?? ""].some((v) =>
        v.toLowerCase().replace(/\s+/g, "").includes(term),
      ),
    );
  }, [accounts, search]);

  return (
    <PanelShell
      title="Bankkonten"
      subtitle="Bankkonten anlegen und verwalten"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={nav}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Bankkonten</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Klick auf ein Konto öffnet die Details zum Bearbeiten.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen …"
            className="h-10 w-56"
            aria-label="Bankkonten durchsuchen"
          />
          <Button type="button" onClick={openCreate} className="rounded-full">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Bankkonto hinzufügen
          </Button>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Kontoinhaber</th>
                <th className="px-5 py-3 font-semibold">Bank</th>
                <th className="px-5 py-3 font-semibold">IBAN</th>
                <th className="px-5 py-3 font-semibold">Projekt</th>
                <th className="px-5 py-3 font-semibold">Gekoppelt</th>
                <th className="px-5 py-3 font-semibold">Briefe</th>
                <th className="px-5 py-3 font-semibold">Dokumente</th>
                <th className="px-5 py-3 font-semibold">Angelegt am</th>
              </tr>
            </thead>
            <tbody>
              {accountsQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    Wird geladen …
                  </td>
                </tr>
              ) : accountsQuery.isError ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    Bankkonten konnten nicht geladen werden.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    {accounts.length === 0
                      ? "Noch keine Bankkonten vorhanden."
                      : "Keine Treffer für diese Suche."}
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    onClick={() => openDetail(a)}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-4 font-medium text-foreground">{a.account_holder}</td>
                    <td className="px-5 py-4 text-foreground">{a.bank}</td>
                    <td className="px-5 py-4 font-mono text-xs text-muted-foreground">
                      {formatIban(a.iban)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{a.project_name ?? "–"}</td>
                    <td className="px-5 py-4">
                      <YesNo value={a.coupled} />
                    </td>
                    <td className="px-5 py-4">
                      <YesNo value={a.letters_complete} />
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{a.documents.length}</td>
                    <td className="px-5 py-4 text-muted-foreground">{formatDate(a.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? editing.account_holder : "Bankkonto hinzufügen"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `${editing.bank} · angelegt am ${formatDate(editing.created_at)}`
                : "Kontoinhaber und Bank sind Pflicht, alles andere optional."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ba_holder">Kontoinhaber</Label>
                <Input
                  id="ba_holder"
                  value={form.account_holder}
                  onChange={(e) => set("account_holder", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ba_bank">Bank</Label>
                <Input
                  id="ba_bank"
                  value={form.bank}
                  onChange={(e) => set("bank", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ba_iban">IBAN (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="ba_iban"
                    value={form.iban}
                    onChange={(e) => set("iban", e.target.value)}
                    className="font-mono"
                    placeholder="DE00 0000 0000 0000 0000 00"
                  />
                  {form.iban ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => copy(form.iban.replace(/\s+/g, ""))}
                      aria-label="IBAN kopieren"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ba_project">Projekt</Label>
                <select
                  id="ba_project"
                  value={form.project_id}
                  onChange={(e) => set("project_id", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="">Kein Projekt</option>
                  {(projectsQuery.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <Label>Briefe vollständig?</Label>
                <YesNoToggle
                  value={form.letters_complete}
                  onChange={(v) => set("letters_complete", v)}
                  allowEmpty
                />
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <Label htmlFor="ba_coupled">Gekoppelt?</Label>
                <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  {form.coupled ? "Ja" : "Nein"}
                  <Switch
                    id="ba_coupled"
                    checked={form.coupled}
                    onCheckedChange={(v) => set("coupled", v)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ba_vmos">VMOS-Gerät (optional)</Label>
                <Input
                  id="ba_vmos"
                  value={form.vmos_device}
                  onChange={(e) => set("vmos_device", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ba_anosim">Anosim-Link (optional)</Label>
                <div className="flex gap-2">
                  <Input
                    id="ba_anosim"
                    value={form.anosim_link}
                    onChange={(e) => set("anosim_link", e.target.value)}
                    placeholder="https://"
                  />
                  {/^https?:\/\//i.test(form.anosim_link.trim()) ? (
                    <Button type="button" variant="outline" size="icon" asChild>
                      <a href={form.anosim_link.trim()} target="_blank" rel="noreferrer" aria-label="Link öffnen">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Anmeldedaten (optional)</Label>
              {form.credentials.map((cred, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={cred.label}
                    onChange={(e) =>
                      set(
                        "credentials",
                        form.credentials.map((c, i) => (i === index ? { ...c, label: e.target.value } : c)),
                      )
                    }
                    placeholder="Bezeichnung, z. B. Benutzername"
                    className="w-2/5"
                  />
                  <Input
                    value={cred.value}
                    onChange={(e) =>
                      set(
                        "credentials",
                        form.credentials.map((c, i) => (i === index ? { ...c, value: e.target.value } : c)),
                      )
                    }
                    placeholder="Wert"
                    className="flex-1 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => cred.value && copy(cred.value)}
                    aria-label="Wert kopieren"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => set("credentials", form.credentials.filter((_, i) => i !== index))}
                    aria-label="Feld entfernen"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => set("credentials", [...form.credentials, { label: "", value: "" }])}
              >
                <Plus className="h-4 w-4" /> Weiteres Feld
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ba_notes">Notizen (optional)</Label>
              <Textarea
                id="ba_notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Dokumente ({form.documents.length})</Label>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Dokumente hochladen
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      handleFiles(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
              {form.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Noch keine Dokumente.</p>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                  {form.documents.map((doc) => (
                    <DocumentItem key={doc.path} doc={doc} onRemove={() => removeDocument(doc)} />
                  ))}
                </div>
              )}
            </div>

            {error ? (
              <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              {editing ? (
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full text-destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    if (window.confirm(`Bankkonto „${editing.account_holder}" wirklich löschen?`)) {
                      deleteMutation.mutate(editing.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Löschen
                </Button>
              ) : (
                <span />
              )}
              <Button
                type="submit"
                className="rounded-full"
                disabled={saveMutation.isPending || uploading}
              >
                {saveMutation.isPending
                  ? "Wird gespeichert …"
                  : editing
                    ? "Änderungen speichern"
                    : "Bankkonto anlegen"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
