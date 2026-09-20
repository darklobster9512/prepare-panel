import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Check,
  ClipboardPaste,
  Copy,
  Download,
  FolderKanban,
  IdCard,
  LayoutDashboard,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { AuftraegeSection } from "@/components/auftraege-section";
import { AuftragLogo } from "@/components/auftrag-logo";
import { statusLabel, statusRingClass } from "@/lib/auftrag-status";
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
  assignAuftraegeBulk,
  regenerateCredentials,
  setVicAuftragInternalMark,
} from "@/lib/vic-auftraege.functions";
import {
  INTERNAL_MARKS,
  INTERNAL_MARK_LABELS,
  internalMarkButtonClass,
  internalMarkRingClass,
  type InternalMark,
} from "@/lib/internal-mark";
import type { VicAuftrag } from "@/lib/vic-auftraege.types";
import { listProjects } from "@/lib/projects.functions";
import {
  assignNumberToVic,
  buyAnosimNumber,
  getAnosimFullServiceProduct,
  getVicShareLink,
  listAssignableNumbers,
  unassignNumberFromVic,
} from "@/lib/anosim.functions";
import { buildExportText } from "@/lib/vic-export";

export const Route = createFileRoute("/_authenticated/admin/vics")({
  head: () => ({
    meta: [
      { title: "Vic-Datensätze – Admin-Panel | IdentPanel" },
      {
        name: "description",
        content:
          "Vic-Datensätze anlegen, Aufträge zuweisen und den Bearbeitungsstand verfolgen.",
      },
      { property: "og:title", content: "Vic-Datensätze – Admin-Panel | IdentPanel" },
      {
        property: "og:description",
        content:
          "Vic-Datensätze anlegen, Aufträge zuweisen und den Bearbeitungsstand verfolgen.",
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
  { label: "Telegram", icon: Send, to: "/admin/telegram" },
];

function formatDate(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("de-DE");
}

function describeValidity(endDate: string | null) {
  if (!endDate) return "Laufzeit unbekannt";
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return "Laufzeit unbekannt";
  const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return `Gültig bis ${formatDate(endDate)} · abgelaufen`;
  return `Gültig bis ${formatDate(endDate)} · noch ${days} ${days === 1 ? "Tag" : "Tage"}`;
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

function LinkRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 shrink-0 text-muted-foreground">{label}</span>
      <a
        href={value}
        target="_blank"
        rel="noreferrer"
        className="truncate font-medium text-primary hover:underline"
      >
        {value}
      </a>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(value)}
        aria-label={`${label} kopieren`}
        className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary"
      >
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

function formatDateTime(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString("de-DE");
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
  const saveAssignments = useServerFn(assignAuftraegeBulk);
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
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [assignError, setAssignError] = useState<string | null>(null);
  const [detailVicId, setDetailVicId] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [buyOpen, setBuyOpen] = useState(false);

  const [selectedFreeNumber, setSelectedFreeNumber] = useState<string>("");

  const unassignNumber = useServerFn(unassignNumberFromVic);
  const fetchProduct = useServerFn(getAnosimFullServiceProduct);
  const buyNumber = useServerFn(buyAnosimNumber);
  const fetchFreeNumbers = useServerFn(listAssignableNumbers);
  const assignNumber = useServerFn(assignNumberToVic);
  const fetchShareLink = useServerFn(getVicShareLink);

  const [exportTarget, setExportTarget] = useState<{
    vic: VicRow;
    item: VicAuftrag;
  } | null>(null);
  const [exportText, setExportText] = useState("");
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportCopied, setExportCopied] = useState(false);

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

  const saveAssignmentsMutation = useMutation({
    mutationFn: (values: {
      vic_id: string;
      add_auftrag_ids: string[];
      remove_auftrag_ids: string[];
    }) => saveAssignments({ data: values }),
    onSuccess: (_result, variables) => {
      setAssignError(null);
      setAssignVicId(null);
      setSuccess(
        variables.add_auftrag_ids.length > 0
          ? `${variables.add_auftrag_ids.length} ${variables.add_auftrag_ids.length === 1 ? "Auftrag" : "Aufträge"} zugewiesen.`
          : "Zuweisungen gespeichert.",
      );
      invalidate();
    },
    onError: () => setAssignError("Zuweisungen konnten nicht gespeichert werden."),
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

  const productQuery = useQuery({
    queryKey: ["admin", "anosim", "product"],
    queryFn: () => fetchProduct(),
    enabled: role === "admin" && buyOpen,
    staleTime: 60_000,
  });


  const freeNumbersQuery = useQuery({
    queryKey: ["admin", "anosim", "free-numbers"],
    queryFn: () => fetchFreeNumbers(),
    enabled: role === "admin" && assignVicId !== null,
    staleTime: 30_000,
    retry: false,
  });

  const assignNumberMutation = useMutation({
    mutationFn: (values: { vicId: string; orderBookingId: number }) =>
      assignNumber({ data: values }),
    onSuccess: () => {
      setPhoneError(null);
      setSelectedFreeNumber("");
      queryClient.invalidateQueries({ queryKey: ["admin", "anosim"] });
      invalidate();
    },
    onError: (err: unknown) =>
      setPhoneError(
        err instanceof Error && err.message
          ? err.message
          : "Nummer konnte nicht zugewiesen werden.",
      ),
  });

  const unassignNumberMutation = useMutation({
    mutationFn: (vicId: string) => unassignNumber({ data: { vicId } }),
    onSuccess: () => {
      setPhoneError(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "anosim"] });
      invalidate();
    },
    onError: () => setPhoneError("Zuweisung konnte nicht entfernt werden."),
  });

  const buyNumberMutation = useMutation({
    mutationFn: (values: { productId: number; vicId: string }) =>
      buyNumber({ data: values }),
    onSuccess: () => {
      setPhoneError(null);
      setBuyOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin", "anosim"] });
      invalidate();
    },
    onError: (err: unknown) =>
      setPhoneError(
        err instanceof Error && err.message
          ? err.message
          : "Kauf fehlgeschlagen. Bitte erneut versuchen.",
      ),
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

  const openAssign = (vic: VicRow) => {
    setAssignError(null);
    setPendingIds((vic.auftraege ?? []).map((item) => item.auftrag_id));
    setAssignVicId(vic.id);
  };

  const openExport = async (vic: VicRow, item: VicAuftrag) => {
    setExportTarget({ vic, item });
    setExportText("");
    setExportError(null);
    setExportCopied(false);
    setExportLoading(true);
    try {
      const { shareLink } = await fetchShareLink({ data: { vicId: vic.id } });
      setExportText(buildExportText(vic, item, shareLink));
    } catch (err) {
      setExportError(
        err instanceof Error
          ? err.message
          : "Export konnte nicht erstellt werden.",
      );
      setExportText(buildExportText(vic, item, vic.phone_share_link));
    } finally {
      setExportLoading(false);
    }
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
                <th className="px-5 py-3 font-semibold">Telefonnummer</th>
                <th className="px-5 py-3 font-semibold">Projekt</th>
                <th className="px-5 py-3 font-semibold">Aufträge</th>
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
                      <span className="inline-flex items-center gap-2">
                        {[vic.first_name, vic.last_name].filter(Boolean).join(" ")}
                        {vic.completed_at ? (
                          <span
                            title="Abgeschlossen"
                            className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-emerald-600"
                          >
                            <Check className="h-3 w-3" aria-hidden="true" />
                            Abgeschlossen
                          </span>
                        ) : null}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(vic.birth_date)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {vic.birth_place || "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{vic.bank || "–"}</td>
                    <td
                      className="px-5 py-4"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {vic.phone_number ? (
                        <span className="inline-flex items-center gap-2 text-foreground">
                          {vic.phone_number}
                          <button
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(vic.phone_number ?? "")}
                            aria-label="Telefonnummer kopieren"
                            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary"
                          >
                            <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">–</span>
                      )}
                    </td>
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
                              title={`${item.auftrag_name} · ${statusLabel(item.status, Boolean(vic.claimed_by), item.admin_only)}`}
                              className={`inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-md bg-background ${statusRingClass(item.status, Boolean(vic.claimed_by), item.admin_only)}`}
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
                          onClick={() => openAssign(vic)}
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

          <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone className="h-4 w-4" aria-hidden="true" />
              Telefonnummer
            </div>

            {assignVic?.phone_number ? (
              <div className="mt-2 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-foreground">
                    {assignVic.phone_number}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      navigator.clipboard?.writeText(assignVic.phone_number ?? "")
                    }
                    aria-label="Nummer kopieren"
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {describeValidity(assignVic.phone_end_date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Gilt für alle Aufträge dieses Datensatzes.
                </p>
                <button
                  type="button"
                  disabled={unassignNumberMutation.isPending}
                  onClick={() => {
                    if (!assignVicId) return;
                    if (!window.confirm("Zuweisung der Telefonnummer entfernen?")) return;
                    unassignNumberMutation.mutate(assignVicId);
                  }}
                  className="text-xs font-medium text-destructive hover:underline"
                >
                  Zuweisung entfernen
                </button>
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Diesem Datensatz ist noch keine Telefonnummer zugewiesen. Es
                  wird eine neue Nummer gekauft (Deutschland · FullService · 30
                  Tage) und fest diesem Datensatz zugewiesen.
                </p>
                <Button
                  type="button"
                  size="sm"
                  className="rounded-full"
                  onClick={() => {
                    setPhoneError(null);
                    setBuyOpen(true);
                  }}
                >
                  Neue Nummer kaufen
                </Button>

                {(freeNumbersQuery.data ?? []).length > 0 ? (
                  <div className="space-y-2 border-t border-border pt-2">
                    <p className="text-xs font-medium text-foreground">
                      Vorhandene freie Nummer zuweisen
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        aria-label="Freie Nummer auswählen"
                        value={selectedFreeNumber}
                        onChange={(event) =>
                          setSelectedFreeNumber(event.target.value)
                        }
                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                      >
                        <option value="">Nummer wählen …</option>
                        {(freeNumbersQuery.data ?? []).map((entry) => (
                          <option
                            key={entry.orderBookingId}
                            value={String(entry.orderBookingId)}
                          >
                            {entry.number}
                          </option>
                        ))}
                      </select>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full"
                        disabled={
                          !selectedFreeNumber || assignNumberMutation.isPending
                        }
                        onClick={() => {
                          if (!assignVicId || !selectedFreeNumber) return;
                          assignNumberMutation.mutate({
                            vicId: assignVicId,
                            orderBookingId: Number(selectedFreeNumber),
                          });
                        }}
                      >
                        {assignNumberMutation.isPending
                          ? "Wird zugewiesen …"
                          : "Zuweisen"}
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {phoneError ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                {phoneError}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {auftraegeQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Wird geladen …</p>
            ) : (auftraegeQuery.data ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Aufträge angelegt.
              </p>
            ) : (
              [...(auftraegeQuery.data ?? [])]
                .map((auftrag, index) => ({ auftrag, index }))
                .sort((a, b) => {
                  const rank = (v: typeof a) => (v.auftrag.ident_type === "email" ? 0 : 1);
                  return rank(a) - rank(b) || a.index - b.index;
                })
                .map(({ auftrag }, position, list) => {
                const assignment = (assignVic?.auftraege ?? []).find(
                  (item) => item.auftrag_id === auftrag.id,
                );
                const isSelected = pendingIds.includes(auftrag.id);
                const isEmail = auftrag.ident_type === "email";
                const previous = position > 0 ? list[position - 1]?.auftrag : null;
                const showHeading =
                  position === 0 || (previous?.ident_type === "email") !== isEmail;
                return (
                  <div key={auftrag.id}>
                  {showHeading ? (
                    <p className="px-1 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {isEmail ? "E-Mail" : "Weitere Aufträge"}
                    </p>
                  ) : null}
                  <div
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
                        variant={isSelected ? "outline" : "default"}
                        size="sm"
                        className="rounded-full"
                        disabled={!assignVicId || saveAssignmentsMutation.isPending}
                        onClick={() =>
                          setPendingIds((current) =>
                            current.includes(auftrag.id)
                              ? current.filter((id) => id !== auftrag.id)
                              : [...current, auftrag.id],
                          )
                        }
                      >
                        {isSelected ? "Abwählen" : "Auswählen"}
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
                  </div>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Änderungen werden erst beim Speichern übernommen. Danach geht eine
              Telegram-Benachrichtigung raus.
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-full"
                disabled={saveAssignmentsMutation.isPending}
                onClick={() => setAssignVicId(null)}
              >
                Abbrechen
              </Button>
              <Button
                type="button"
                className="rounded-full"
                disabled={saveAssignmentsMutation.isPending || !assignVicId}
                onClick={() => {
                  if (!assignVicId) return;
                  const current = (assignVic?.auftraege ?? []).map(
                    (item) => item.auftrag_id,
                  );
                  saveAssignmentsMutation.mutate({
                    vic_id: assignVicId,
                    add_auftrag_ids: pendingIds.filter((id) => !current.includes(id)),
                    remove_auftrag_ids: current.filter(
                      (id) => !pendingIds.includes(id),
                    ),
                  });
                }}
              >
                {saveAssignmentsMutation.isPending ? "Wird gespeichert …" : "Speichern"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={buyOpen}
        onOpenChange={(value) => {
          if (!value && !buyNumberMutation.isPending) setBuyOpen(false);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Telefonnummer kaufen</DialogTitle>
            <DialogDescription>
              Deutschland · FullService · 30 Tage – wird nach der Bestätigung gekauft und
              diesem Datensatz zugewiesen.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm">
            {productQuery.isLoading ? (
              <p className="text-muted-foreground">Preis wird geladen …</p>
            ) : productQuery.isError ? (
              <p className="text-destructive">Preis konnte nicht geladen werden.</p>
            ) : (
              <>
                <p className="flex items-center justify-between">
                  <span className="text-muted-foreground">Preis</span>
                  <span className="text-base font-semibold text-foreground">
                    {(productQuery.data?.price ?? 0).toFixed(2)} USD
                  </span>
                </p>
                <p className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Verfügbar</span>
                  <span className="text-foreground">
                    {productQuery.data?.availableCount ?? 0}
                  </span>
                </p>
              </>
            )}
          </div>

          {phoneError ? (
            <p className="flex items-center gap-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {phoneError}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              disabled={buyNumberMutation.isPending}
              onClick={() => setBuyOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={
                buyNumberMutation.isPending ||
                !productQuery.data?.productId ||
                !assignVicId
              }
              onClick={() => {
                if (!assignVicId || !productQuery.data?.productId) return;
                buyNumberMutation.mutate({
                  productId: productQuery.data.productId,
                  vicId: assignVicId,
                });
              }}
            >
              {buyNumberMutation.isPending ? "Wird gekauft …" : "Kaufen bestätigen"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailVicId !== null}
        onOpenChange={(value) => {
          if (!value) setDetailVicId(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl lg:max-w-5xl">
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
                <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
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

              <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-foreground">E-Mail-Konto</h3>
                {detailVic.email_address ? (
                  <div className="mt-3 space-y-1 text-sm">
                    <CredentialRow
                      label="Erstellte E-Mail"
                      value={detailVic.email_address}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Noch keine E-Mail hinterlegt.
                  </p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  Telefonnummer
                </h3>
                {detailVic.phone_number ? (
                  <div className="mt-2 space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {detailVic.phone_number}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard?.writeText(detailVic.phone_number ?? "")
                        }
                        aria-label="Telefonnummer kopieren"
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                      >
                        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {describeValidity(detailVic.phone_end_date)}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Diesem Datensatz ist noch keine Telefonnummer zugewiesen.
                  </p>
                )}
              </div>
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
                          {item.completed_at ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (detailVic) openExport(detailVic, item);
                              }}
                              className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            >
                              <Download className="h-3.5 w-3.5" aria-hidden="true" />
                              Export
                            </button>
                          ) : null}
                          <span
                            className={`${item.completed_at ? "" : "ml-auto "}rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                               item.admin_only
                                 ? "border-purple-500/40 bg-purple-500/10 text-purple-600"
                                 : item.status === "erfolgreich"
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600"
                                : item.status === "fehlgeschlagen"
                                  ? "border-destructive/40 bg-destructive/10 text-destructive"
                                  : "border-border bg-secondary text-muted-foreground"
                            }`}
                          >
                            {statusLabel(item.status, detailVic.claimed_by !== null, item.admin_only)}
                          </span>
                        </div>
                          <div className="mt-3 space-y-1 border-t border-border/60 pt-3 text-sm">
                          {item.admin_only && item.password ? (
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Intern generiert
                              </p>
                              <CredentialRow label="Passwort" value={item.password} />
                            </div>
                          ) : null}
                          {item.used_login_name ||
                          item.used_password ||
                          item.webid_link ||
                          item.postident_link ? (
                            <div className="mt-3 space-y-1 border-t border-border/60 pt-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Verwendet
                              </p>
                              {item.used_login_name ? (
                                <CredentialRow
                                  label="Anmeldename"
                                  value={item.used_login_name}
                                />
                              ) : null}
                              {item.used_password ? (
                                <CredentialRow
                                  label="Passwort"
                                  value={item.used_password}
                                />
                              ) : null}
                              {item.webid_link ? (
                                <LinkRow label="WebID-Link" value={item.webid_link} />
                              ) : null}
                              {item.postident_link ? (
                                <LinkRow
                                  label="Postident-Link"
                                  value={item.postident_link}
                                />
                              ) : null}
                            </div>
                          ) : !item.admin_only ? (
                            <p className="mt-3 border-t border-border/60 pt-3 text-muted-foreground">
                              Noch keine verwendeten Daten.
                            </p>
                          ) : null}

                          {item.completed_at ? (
                            <p className="pt-2 text-xs text-muted-foreground">
                              Abgeschlossen am {formatDateTime(item.completed_at)}
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
                    openAssign(detailVic);
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

      <Dialog
        open={exportTarget !== null}
        onOpenChange={(next) => {
          if (!next) setExportTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              Export – {exportTarget?.item.auftrag_name ?? ""}
            </DialogTitle>
            <DialogDescription>
              Text bei Bedarf anpassen und kopieren. Der AnoSIM-Share-Link wird
              pro Nummer einmal erzeugt und danach wiederverwendet.
            </DialogDescription>
          </DialogHeader>
          {exportError ? (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {exportError}
            </p>
          ) : null}
          <Textarea
            value={exportLoading ? "Share-Link wird geladen …" : exportText}
            onChange={(event) => setExportText(event.target.value)}
            readOnly={exportLoading}
            rows={22}
            className="font-mono text-xs"
            aria-label="Export-Text"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-full"
              onClick={() => setExportTarget(null)}
            >
              Schließen
            </Button>
            <Button
              type="button"
              className="rounded-full"
              disabled={exportLoading || !exportText}
              onClick={async () => {
                await navigator.clipboard?.writeText(exportText);
                setExportCopied(true);
              }}
            >
              {exportCopied ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4" aria-hidden="true" />
              )}
              {exportCopied ? "Kopiert" : "Kopieren"}
            </Button>
          </div>
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
