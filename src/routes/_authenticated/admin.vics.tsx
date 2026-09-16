import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  IdCard,
  LayoutDashboard,
  Pencil,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

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
import { useAuth } from "@/hooks/use-auth";
import { createVic, deleteVic, listVics, updateVic, type VicRow } from "@/lib/vics.functions";

export const Route = createFileRoute("/_authenticated/admin/vics")({
  head: () => ({
    meta: [
      { title: "Vic-Datensätze – Admin-Panel" },
      {
        name: "description",
        content: "Vic-Datensätze anlegen, bearbeiten und einsehen.",
      },
      { property: "og:title", content: "Vic-Datensätze – Admin-Panel" },
      {
        property: "og:description",
        content: "Vic-Datensätze anlegen, bearbeiten und einsehen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminVics,
});

type FormState = {
  first_name: string;
  last_name: string;
  birth_date: string;
  birth_place: string;
  street: string;
  postal_code: string;
  city: string;
  marital_status: string;
  tax_id: string;
  bank: string;
  notes: string;
};

const emptyForm: FormState = {
  first_name: "",
  last_name: "",
  birth_date: "",
  birth_place: "",
  street: "",
  postal_code: "",
  city: "",
  marital_status: "",
  tax_id: "",
  bank: "",
  notes: "",
};

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
];

function formatDate(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("de-DE");
}

function AdminVics() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchVics = useServerFn(listVics);
  const addVic = useServerFn(createVic);
  const editVic = useServerFn(updateVic);
  const removeVic = useServerFn(deleteVic);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/mitarbeiter", replace: true });
    }
  }, [loading, role, navigate]);

  const vicsQuery = useQuery({
    queryKey: ["admin", "vics"],
    queryFn: () => fetchVics(),
    enabled: role === "admin",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "vics"] });

  const saveMutation = useMutation({
    mutationFn: (values: FormState & { id?: string }) =>
      values.id
        ? editVic({ data: { ...values, id: values.id } })
        : addVic({ data: values }),
    onSuccess: () => {
      setOpen(false);
      setForm(emptyForm);
      setError(null);
      setSuccess(editingId ? "Datensatz aktualisiert." : "Datensatz angelegt.");
      setEditingId(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("Vornamen") || message.includes("Nachnamen")
          ? message
          : "Datensatz konnte nicht gespeichert werden. Bitte erneut versuchen.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeVic({ data: { id } }),
    onSuccess: () => {
      setSuccess("Datensatz gelöscht.");
      invalidate();
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const openEdit = (vic: VicRow) => {
    setEditingId(vic.id);
    setForm({
      first_name: vic.first_name ?? "",
      last_name: vic.last_name ?? "",
      birth_date: vic.birth_date ?? "",
      birth_place: vic.birth_place ?? "",
      street: vic.street ?? "",
      postal_code: vic.postal_code ?? "",
      city: vic.city ?? "",
      marital_status: vic.marital_status ?? "",
      tax_id: vic.tax_id ?? "",
      bank: vic.bank ?? "",
      notes: vic.notes ?? "",
    });
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.first_name.trim()) {
      setError("Bitte einen Vornamen eingeben.");
      return;
    }
    if (!form.last_name.trim()) {
      setError("Bitte einen Nachnamen eingeben.");
      return;
    }

    saveMutation.mutate(editingId ? { ...form, id: editingId } : form);
  };

  const handleDelete = (vic: VicRow) => {
    const name = `${vic.first_name} ${vic.last_name}`.trim();
    if (!window.confirm(`Datensatz von ${name} wirklich löschen?`)) return;
    setSuccess(null);
    deleteMutation.mutate(vic.id);
  };

  const vics = vicsQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vics;
    return vics.filter((vic) =>
      [vic.first_name, vic.last_name, vic.city, vic.tax_id]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(term)),
    );
  }, [vics, search]);

  const set = (key: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: event.target.value }));

  return (
    <PanelShell
      title="Vics"
      subtitle="Datensätze anlegen und verwalten"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={nav}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Vic-Datensätze
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Pflicht sind nur Vor- und Nachname. Alle weiteren Angaben sind optional.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suchen …"
            className="h-10 w-48"
            aria-label="Datensätze durchsuchen"
          />
          <Button type="button" onClick={openCreate} className="rounded-full">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Vic hinzufügen
          </Button>
        </div>
      </div>

      {success ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
          {success}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Geburtsdatum</th>
                <th className="px-5 py-3 font-semibold">Geburtsort</th>
                <th className="px-5 py-3 font-semibold">Adresse</th>
                <th className="px-5 py-3 font-semibold">Familienstand</th>
                <th className="px-5 py-3 font-semibold">Steuer-ID</th>
                <th className="px-5 py-3 font-semibold">Bank</th>
                <th className="px-5 py-3 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {vicsQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    Wird geladen …
                  </td>
                </tr>
              ) : vicsQuery.isError ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    Datensätze konnten nicht geladen werden.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    {vics.length === 0
                      ? "Noch keine Datensätze vorhanden."
                      : "Keine Treffer für diese Suche."}
                  </td>
                </tr>
              ) : (
                filtered.map((vic) => (
                  <tr key={vic.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4 font-medium text-foreground">
                      {[vic.first_name, vic.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(vic.birth_date)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vic.birth_place || "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vic.street ? <span className="block">{vic.street}</span> : null}
                      {vic.postal_code || vic.city
                        ? [vic.postal_code, vic.city].filter(Boolean).join(" ")
                        : vic.street
                          ? null
                          : "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vic.marital_status || "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vic.tax_id || "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{vic.bank || "–"}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(vic)}
                          aria-label="Bearbeiten"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(vic)}
                          aria-label="Löschen"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Datensatz bearbeiten" : "Vic hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              Vorname und Nachname genügen, alles Weitere kannst du später ergänzen.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Vorname(n)</Label>
                <Input
                  id="first_name"
                  value={form.first_name}
                  onChange={set("first_name")}
                  placeholder="Stefan Christian"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nachname</Label>
                <Input id="last_name" value={form.last_name} onChange={set("last_name")} required />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birth_date">Geburtsdatum</Label>
                <Input id="birth_date" type="date" value={form.birth_date} onChange={set("birth_date")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="birth_place">Geburtsort</Label>
                <Input id="birth_place" value={form.birth_place} onChange={set("birth_place")} placeholder="Köln" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="street">Straße und Hausnummer</Label>
              <Input id="street" value={form.street} onChange={set("street")} placeholder="Am Keltersberg 9" />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="postal_code">PLZ</Label>
                <Input id="postal_code" value={form.postal_code} onChange={set("postal_code")} placeholder="53783" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="city">Ort</Label>
                <Input id="city" value={form.city} onChange={set("city")} placeholder="Eitorf" />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="marital_status">Familienstand</Label>
                <Input id="marital_status" value={form.marital_status} onChange={set("marital_status")} placeholder="geschieden" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tax_id">Steuer-ID</Label>
                <Input id="tax_id" value={form.tax_id} onChange={set("tax_id")} placeholder="63051299484" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bank">Aktuelle Bank</Label>
                <Input id="bank" value={form.bank} onChange={set("bank")} placeholder="N26" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notizen</Label>
              <Input id="notes" value={form.notes} onChange={set("notes")} />
            </div>

            {error ? (
              <p className="flex items-start gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={saveMutation.isPending} className="w-full rounded-full">
              {saveMutation.isPending
                ? "Wird gespeichert …"
                : editingId
                  ? "Änderungen speichern"
                  : "Datensatz anlegen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
