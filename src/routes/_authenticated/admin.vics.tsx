import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  ClipboardPaste,
  Copy,
  FolderKanban,
  IdCard,
  LayoutDashboard,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AuftraegeSection } from "@/components/auftraege-section";
import { AuftragLogo } from "@/components/auftrag-logo";
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import { parseVics, type ParsedVic } from "@/lib/vic-parser";
import {
  assignVicProject,
  createVic,
  createVicsBulk,
  deleteVic,
  listVics,
  updateVic,
  type VicRow,
} from "@/lib/vics.functions";
import { listAuftraege } from "@/lib/auftraege.functions";
import {
  assignAuftrag,
  regenerateCredentials,
  unassignAuftrag,
} from "@/lib/vic-auftraege.functions";
import type { VicAuftrag } from "@/lib/vic-auftraege.types";
import { listProjects } from "@/lib/projects.functions";

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
  birth_name: string;
  birth_date: string;
  birth_place: string;
  street: string;
  postal_code: string;
  city: string;
  marital_status: string;
  tax_id: string;
  bank: string;
  notes: string;
  project_id: string;
};

const emptyForm: FormState = {
  first_name: "",
  last_name: "",
  birth_name: "",
  birth_date: "",
  birth_place: "",
  street: "",
  postal_code: "",
  city: "",
  marital_status: "",
  tax_id: "",
  bank: "",
  notes: "",
  project_id: "",
};

const previewFields: { key: keyof ParsedVic; label: string; type?: string }[] = [
  { key: "first_name", label: "Vorname(n)" },
  { key: "last_name", label: "Nachname" },
  { key: "birth_name", label: "Geburtsname" },
  { key: "birth_date", label: "Geburtsdatum", type: "date" },
  { key: "birth_place", label: "Geburtsort" },
  { key: "street", label: "Straße" },
  { key: "postal_code", label: "PLZ" },
  { key: "city", label: "Ort" },
  { key: "marital_status", label: "Familienstand" },
  { key: "tax_id", label: "Steuer-ID" },
  { key: "bank", label: "Bank" },
  { key: "notes", label: "Notizen" },
];

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
  { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
  { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
];

function formatDate(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("de-DE");
}

function CredentialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value)}
        aria-label={`${label} kopieren`}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

type DialogMode = "form" | "import" | "preview";

function AdminVics() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchVics = useServerFn(listVics);
  const addVic = useServerFn(createVic);
  const addVicsBulk = useServerFn(createVicsBulk);
  const editVic = useServerFn(updateVic);
  const removeVic = useServerFn(deleteVic);
  const assignProject = useServerFn(assignVicProject);
  const fetchProjects = useServerFn(listProjects);
  const fetchAuftraege = useServerFn(listAuftraege);
  const addAssignment = useServerFn(assignAuftrag);
  const removeAssignment = useServerFn(unassignAuftrag);
  const renewCredentials = useServerFn(regenerateCredentials);

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<DialogMode>("form");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [importText, setImportText] = useState("");
  const [parsed, setParsed] = useState<ParsedVic[]>([]);
  const [selected, setSelected] = useState<boolean[]>([]);
  const [assignVicId, setAssignVicId] = useState<string | null>(null);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [detailVicId, setDetailVicId] = useState<string | null>(null);

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

  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => fetchProjects(),
    enabled: role === "admin",
  });

  const auftraegeQuery = useQuery({
    queryKey: ["admin", "auftraege"],
    queryFn: () => fetchAuftraege(),
    enabled: role === "admin",
  });

  const patchVicAuftraege = (
    vicId: string,
    update: (current: VicAuftrag[]) => VicAuftrag[],
  ) =>
    queryClient.setQueryData<VicRow[]>(["admin", "vics"], (prev) =>
      (prev ?? []).map((vic) =>
        vic.id === vicId ? { ...vic, auftraege: update(vic.auftraege ?? []) } : vic,
      ),
    );

  const assignAuftragMutation = useMutation({
    mutationFn: (values: { vic_id: string; auftrag_id: string }) =>
      addAssignment({ data: values }),
    onSuccess: (row, variables) => {
      patchVicAuftraege(variables.vic_id, (current) => [...current, row]);
      setAssignError(null);
    },
    onError: () => setAssignError("Auftrag konnte nicht zugewiesen werden."),
  });

  const unassignAuftragMutation = useMutation({
    mutationFn: (values: { vic_id: string; auftrag_id: string }) =>
      removeAssignment({ data: values }),
    onSuccess: (_data, variables) => {
      patchVicAuftraege(variables.vic_id, (current) =>
        current.filter((item) => item.auftrag_id !== variables.auftrag_id),
      );
      setAssignError(null);
    },
    onError: () => setAssignError("Zuweisung konnte nicht entfernt werden."),
  });

  const regenerateMutation = useMutation({
    mutationFn: (values: { vic_id: string; auftrag_id: string }) =>
      renewCredentials({ data: values }),
    onSuccess: (row, variables) => {
      patchVicAuftraege(variables.vic_id, (current) =>
        current.map((item) => (item.auftrag_id === variables.auftrag_id ? row : item)),
      );
      setAssignError(null);
    },
    onError: () => setAssignError("Zugangsdaten konnten nicht neu erzeugt werden."),
  });


  const saveMutation = useMutation({
    mutationFn: (values: FormState & { id?: string }) => {
      const payload = { ...values, project_id: values.project_id || null };
      return values.id
        ? editVic({ data: { ...payload, id: values.id } })
        : addVic({ data: payload });
    },
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

  const bulkMutation = useMutation({
    mutationFn: (records: ParsedVic[]) => addVicsBulk({ data: { records } }),
    onSuccess: (_data, records) => {
      setOpen(false);
      setMode("form");
      setImportText("");
      setParsed([]);
      setSelected([]);
      setError(null);
      setSuccess(
        records.length === 1
          ? "1 Datensatz importiert."
          : `${records.length} Datensätze importiert.`,
      );
      invalidate();
    },
    onError: () => {
      setError("Import fehlgeschlagen. Bitte erneut versuchen.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeVic({ data: { id } }),
    onSuccess: () => {
      setSuccess("Datensatz gelöscht.");
      invalidate();
    },
  });

  const assignMutation = useMutation({
    mutationFn: (values: { id: string; project_id: string | null }) =>
      assignProject({ data: values }),
    onSuccess: (_data, variables) => {
      const projectName =
        variables.project_id === null
          ? null
          : (projectsQuery.data ?? []).find(
              (project) => project.id === variables.project_id,
            )?.name ?? null;
      queryClient.setQueryData<VicRow[]>(["admin", "vics"], (prev) =>
        (prev ?? []).map((vic) =>
          vic.id === variables.id
            ? { ...vic, project_id: variables.project_id, project_name: projectName }
            : vic,
        ),
      );
      setSuccess("Projekt zugewiesen.");
    },
    onError: () => {
      setError("Projekt konnte nicht zugewiesen werden. Bitte erneut versuchen.");
    },
  });

  const resetDialog = () => {
    setError(null);
    setSuccess(null);
    setImportText("");
    setParsed([]);
    setSelected([]);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMode("form");
    resetDialog();
    setOpen(true);
  };

  const openEdit = (vic: VicRow) => {
    setEditingId(vic.id);
    setForm({
      first_name: vic.first_name ?? "",
      last_name: vic.last_name ?? "",
      birth_name: vic.birth_name ?? "",
      birth_date: vic.birth_date ?? "",
      birth_place: vic.birth_place ?? "",
      street: vic.street ?? "",
      postal_code: vic.postal_code ?? "",
      city: vic.city ?? "",
      marital_status: vic.marital_status ?? "",
      tax_id: vic.tax_id ?? "",
      bank: vic.bank ?? "",
      notes: vic.notes ?? "",
      project_id: vic.project_id ?? "",
    });
    setMode("form");
    resetDialog();
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

  const handleParse = () => {
    setError(null);
    const records = parseVics(importText);
    if (records.length === 0) {
      setError("Es konnten keine Datensätze erkannt werden.");
      return;
    }
    setParsed(records);
    setSelected(records.map(() => true));
    setMode("preview");
  };

  const updateParsed = (index: number, key: keyof ParsedVic, value: string) =>
    setParsed((prev) =>
      prev.map((record, i) => (i === index ? { ...record, [key]: value } : record)),
    );

  const removeParsed = (index: number) => {
    setParsed((prev) => prev.filter((_, i) => i !== index));
    setSelected((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBulkSave = () => {
    setError(null);
    const chosen = parsed.filter(
      (record, index) =>
        selected[index] && record.first_name.trim() && record.last_name.trim(),
    );
    if (chosen.length === 0) {
      setError("Bitte mindestens einen vollständigen Datensatz auswählen.");
      return;
    }
    bulkMutation.mutate(chosen);
  };

  const handleDelete = (vic: VicRow) => {
    const name = `${vic.first_name} ${vic.last_name}`.trim();
    if (!window.confirm(`Datensatz von ${name} wirklich löschen?`)) return;
    setSuccess(null);
    deleteMutation.mutate(vic.id);
  };

  const vics = vicsQuery.data ?? [];
  const assignVic = vics.find((vic) => vic.id === assignVicId) ?? null;
  const detailVic = vics.find((vic) => vic.id === detailVicId) ?? null;
  const projects = projectsQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return vics;
    return vics.filter((vic) =>
      [vic.first_name, vic.last_name, vic.birth_name, vic.city, vic.tax_id, vic.project_name]
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
      <AuftraegeSection enabled={role === "admin"} />

      <div className="mt-10 flex flex-wrap items-end justify-between gap-4">

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
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Geburtsdatum</th>
                <th className="px-5 py-3 font-semibold">Geburtsort</th>
                <th className="px-5 py-3 font-semibold">Bank</th>
                <th className="px-5 py-3 font-semibold">Projekt</th>
                <th className="px-5 py-3 font-semibold">Aufträge</th>
                <th className="px-5 py-3 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {vicsQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={7}>
                    Wird geladen …
                  </td>
                </tr>
              ) : vicsQuery.isError ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={7}>
                    Datensätze konnten nicht geladen werden.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={7}>
                    {vics.length === 0
                      ? "Noch keine Datensätze vorhanden."
                      : "Keine Treffer für diese Suche."}
                  </td>
                </tr>
              ) : (
                filtered.map((vic) => (
                  <tr
                    key={vic.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailVicId(vic.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setDetailVicId(vic.id);
                      }
                    }}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-4 font-medium text-foreground">
                      {[vic.first_name, vic.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(vic.birth_date)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vic.birth_place || "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{vic.bank || "–"}</td>
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      <select
                        value={vic.project_id ?? ""}
                        onChange={(event) =>
                          assignMutation.mutate({
                            id: vic.id,
                            project_id: event.target.value || null,
                          })
                        }
                        aria-label="Projekt zuweisen"
                        className="h-9 w-36 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
                      >
                        <option value="">Kein Projekt</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-4">
                      {(vic.auftraege ?? []).length === 0 ? (
                        <span className="text-muted-foreground">–</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {(vic.auftraege ?? []).slice(0, 4).map((item) => (
                            <span
                              key={item.id}
                              title={item.auftrag_name}
                              className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-md border border-border bg-background"
                            >
                              <AuftragLogo
                                value={item.logo_path}
                                alt={item.auftrag_name}
                                className="h-full w-full object-contain p-0.5"
                                fallback={
                                  <span className="text-[0.6rem] font-semibold text-muted-foreground">
                                    {item.auftrag_name.slice(0, 2).toUpperCase()}
                                  </span>
                                }
                              />
                            </span>
                          ))}
                          {(vic.auftraege ?? []).length > 4 ? (
                            <span className="text-xs text-muted-foreground">
                              +{(vic.auftraege ?? []).length - 4}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4" onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAssignError(null);
                            setAssignVicId(vic.id);
                          }}
                          aria-label="Aufträge zuweisen"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                        >
                          <Plus className="h-4 w-4" aria-hidden="true" />
                        </button>
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

      <Dialog
        open={assignVicId !== null}
        onOpenChange={(value) => {
          if (!value) setAssignVicId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Aufträge zuweisen</DialogTitle>
            <DialogDescription>
              {assignVic
                ? `${assignVic.first_name} ${assignVic.last_name}`.trim()
                : "Datensatz"}{" "}
              – Aufträge an- oder abwählen. Zugangsdaten werden automatisch erzeugt,
              wenn der Auftrag das vorsieht.
            </DialogDescription>
          </DialogHeader>

          {assignError ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {assignError}
            </p>
          ) : null}

          <div className="space-y-2">
            {auftraegeQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Wird geladen …</p>
            ) : (auftraegeQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Aufträge angelegt.
              </p>
            ) : (
              (auftraegeQuery.data ?? []).map((auftrag) => {
                const assignment = (assignVic?.auftraege ?? []).find(
                  (item) => item.auftrag_id === auftrag.id,
                );
                return (
                  <div
                    key={auftrag.id}
                    className="rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                        <AuftragLogo
                          value={auftrag.logo_path}
                          alt={auftrag.name}
                          className="h-full w-full object-contain p-1"
                          fallback={
                            <span className="text-[0.65rem] font-semibold text-muted-foreground">
                              {auftrag.name.slice(0, 2).toUpperCase()}
                            </span>
                          }
                        />
                      </span>
                      <span className="flex-1 text-sm font-medium text-foreground">
                        {auftrag.name}
                      </span>
                      <Button
                        type="button"
                        variant={assignment ? "outline" : "default"}
                        size="sm"
                        className="rounded-full"
                        disabled={
                          !assignVicId ||
                          assignAuftragMutation.isPending ||
                          unassignAuftragMutation.isPending
                        }
                        onClick={() => {
                          if (!assignVicId) return;
                          const values = {
                            vic_id: assignVicId,
                            auftrag_id: auftrag.id,
                          };
                          if (assignment) unassignAuftragMutation.mutate(values);
                          else assignAuftragMutation.mutate(values);
                        }}
                      >
                        {assignment ? "Entfernen" : "Zuweisen"}
                      </Button>
                    </div>

                    {assignment ? (
                      <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                        {assignment.login_name ? (
                          <CredentialRow
                            label="Anmeldename"
                            value={assignment.login_name}
                          />
                        ) : null}
                        {assignment.password ? (
                          <CredentialRow label="Passwort" value={assignment.password} />
                        ) : null}
                        {!assignment.login_name && !assignment.password ? (
                          <p className="text-muted-foreground">
                            Für diesen Auftrag werden keine Zugangsdaten erzeugt.
                          </p>
                        ) : null}
                        {auftrag.generate_loginname && !assignment.login_name ? (
                          <p className="text-muted-foreground">
                            Anmeldename nicht möglich – Geburtsdatum fehlt.
                          </p>
                        ) : null}
                        {auftrag.generate_password || auftrag.generate_loginname ? (
                          <button
                            type="button"
                            onClick={() =>
                              assignVicId &&
                              regenerateMutation.mutate({
                                vic_id: assignVicId,
                                auftrag_id: auftrag.id,
                              })
                            }
                            className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                          >
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                            Neu erzeugen
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailVicId !== null}
        onOpenChange={(value) => {
          if (!value) setDetailVicId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {detailVic
                ? `${detailVic.first_name} ${detailVic.last_name}`.trim()
                : "Datensatz"}
            </DialogTitle>
            <DialogDescription>
              {detailVic?.project_name
                ? `Projekt: ${detailVic.project_name}`
                : "Kein Projekt zugewiesen"}
            </DialogDescription>
          </DialogHeader>

          {detailVic ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Persönliche Daten
                </h3>
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                  {[
                    ["Geburtsname", detailVic.birth_name],
                    ["Geburtsdatum", formatDate(detailVic.birth_date)],
                    ["Geburtsort", detailVic.birth_place],
                    ["Straße", detailVic.street],
                    ["PLZ", detailVic.postal_code],
                    ["Ort", detailVic.city],
                    ["Familienstand", detailVic.marital_status],
                    ["Steuer-ID", detailVic.tax_id],
                    ["Bank", detailVic.bank],
                    ["Angelegt am", formatDate(detailVic.created_at)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex gap-2">
                      <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
                      <dd className="font-medium text-foreground">{value || "–"}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {detailVic.notes ? (
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Notizen</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                    {detailVic.notes}
                  </p>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Zugewiesene Aufträge
                </h3>
                {(detailVic.auftraege ?? []).length === 0 ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Noch keine Aufträge zugewiesen.
                  </p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {(detailVic.auftraege ?? []).map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-border bg-card px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-border bg-background">
                            <AuftragLogo
                              value={item.logo_path}
                              alt={item.auftrag_name}
                              className="h-full w-full object-contain p-1"
                              fallback={
                                <span className="text-[0.65rem] font-semibold text-muted-foreground">
                                  {item.auftrag_name.slice(0, 2).toUpperCase()}
                                </span>
                              }
                            />
                          </span>
                          <span className="text-sm font-medium text-foreground">
                            {item.auftrag_name}
                          </span>
                        </div>
                        <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                          {item.login_name ? (
                            <CredentialRow label="Anmeldename" value={item.login_name} />
                          ) : null}
                          {item.password ? (
                            <CredentialRow label="Passwort" value={item.password} />
                          ) : null}
                          {!item.login_name && !item.password ? (
                            <p className="text-muted-foreground">
                              Keine Zugangsdaten hinterlegt.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setAssignError(null);
                    setAssignVicId(detailVic.id);
                    setDetailVicId(null);
                  }}
                >
                  Aufträge zuweisen
                </Button>
                <Button
                  type="button"
                  className="rounded-full"
                  onClick={() => {
                    setDetailVicId(null);
                    openEdit(detailVic);
                  }}
                >
                  Bearbeiten
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>


      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {mode === "form"
                ? editingId
                  ? "Datensatz bearbeiten"
                  : "Vic hinzufügen"
                : "Schnell-Import"}
            </DialogTitle>
            <DialogDescription>
              {mode === "form"
                ? "Vorname und Nachname genügen, alles Weitere kannst du später ergänzen."
                : mode === "import"
                  ? "Mehrere Datensätze als Text einfügen – die Felder werden automatisch erkannt."
                  : "Bitte die erkannten Datensätze prüfen und bei Bedarf korrigieren."}
            </DialogDescription>
          </DialogHeader>

          {mode === "form" && !editingId ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setMode("import");
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <ClipboardPaste className="h-4 w-4 shrink-0" aria-hidden="true" />
              Schnell-Import – mehrere Datensätze auf einmal einfügen
            </button>
          ) : null}

          {mode === "form" ? (
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

              <div className="space-y-2">
                <Label htmlFor="birth_name">Geburtsname</Label>
                <Input id="birth_name" value={form.birth_name} onChange={set("birth_name")} placeholder="Sens" />
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
                <Label htmlFor="project_id">Projekt</Label>
                <select
                  id="project_id"
                  value={form.project_id}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, project_id: event.target.value }))
                  }
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="">Kein Projekt</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
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
          ) : null}

          {mode === "import" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import_text">Datensätze einfügen</Label>
                <Textarea
                  id="import_text"
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={16}
                  autoFocus
                  className="min-h-[18rem] font-mono text-xs"
                  placeholder={
                    "Stefan Christian Ehses\n24.07.1966 in Trier\nHordenbachstr. 10\n42369 Wuppertal\n\nVorname: Jacqueline\nNachname: van Steen\nGeburtsdatum: 03.07.1979\n…"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Mehrere Datensätze durch eine Leerzeile oder eine Trennzeile (===) trennen.
                </p>
              </div>

              {error ? (
                <p className="flex items-start gap-2 text-sm font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setError(null);
                    setMode("form");
                  }}
                >
                  Zurück
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-full"
                  onClick={handleParse}
                  disabled={!importText.trim()}
                >
                  Datensätze erkennen
                </Button>
              </div>
            </div>
          ) : null}

          {mode === "preview" ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {parsed.length === 1
                  ? "1 Datensatz erkannt."
                  : `${parsed.length} Datensätze erkannt.`}
              </p>

              <div className="space-y-4">
                {parsed.map((record, index) => {
                  const incomplete = !record.first_name.trim() || !record.last_name.trim();
                  return (
                    <div
                      key={index}
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <input
                            type="checkbox"
                            checked={selected[index] ?? false}
                            onChange={(event) =>
                              setSelected((prev) =>
                                prev.map((value, i) =>
                                  i === index ? event.target.checked : value,
                                ),
                              )
                            }
                            className="h-4 w-4 accent-primary"
                          />
                          {[record.first_name, record.last_name]
                            .filter(Boolean)
                            .join(" ") || `Datensatz ${index + 1}`}
                        </label>
                        <button
                          type="button"
                          onClick={() => removeParsed(index)}
                          aria-label="Aus Import entfernen"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>

                      {incomplete ? (
                        <p className="mt-2 flex items-start gap-2 text-xs font-medium text-destructive">
                          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          Vor- und Nachname fehlen – dieser Datensatz wird nicht gespeichert.
                        </p>
                      ) : null}

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        {previewFields.map((field) => (
                          <div key={field.key} className="space-y-1">
                            <Label
                              htmlFor={`p-${index}-${field.key}`}
                              className="text-xs text-muted-foreground"
                            >
                              {field.label}
                            </Label>
                            <Input
                              id={`p-${index}-${field.key}`}
                              type={field.type ?? "text"}
                              value={record[field.key]}
                              onChange={(event) =>
                                updateParsed(index, field.key, event.target.value)
                              }
                              className="h-9"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {error ? (
                <p className="flex items-start gap-2 text-sm font-medium text-destructive">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </p>
              ) : null}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => {
                    setError(null);
                    setMode("import");
                  }}
                >
                  Zurück
                </Button>
                <Button
                  type="button"
                  className="flex-1 rounded-full"
                  onClick={handleBulkSave}
                  disabled={bulkMutation.isPending}
                >
                  {bulkMutation.isPending ? "Wird gespeichert …" : "Alle speichern"}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
