import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  FolderKanban,
  IdCard,
  LayoutDashboard,
  Pencil,
  Phone,
  Plus,
  Send,
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
import {
  createProject,
  deleteProject,
  listProjects,
  updateProject,
  type ProjectRow,
} from "@/lib/projects.functions";

export const Route = createFileRoute("/_authenticated/admin/projekte")({
  head: () => ({
    meta: [
      { title: "Projekte – Admin-Panel | IdentPanel" },
      {
        name: "description",
        content: "Projekte anlegen, umbenennen und Datensätzen zuordnen.",
      },
      { property: "og:title", content: "Projekte – Admin-Panel | IdentPanel" },
      {
        property: "og:description",
        content: "Projekte anlegen, umbenennen und Datensätzen zuordnen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminProjekte,
});

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
  { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
  { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
  { label: "Telegram", icon: Send, to: "/admin/telegram" },
];

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString("de-DE");
}

function AdminProjekte() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchProjects = useServerFn(listProjects);
  const addProject = useServerFn(createProject);
  const editProject = useServerFn(updateProject);
  const removeProject = useServerFn(deleteProject);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/mitarbeiter", replace: true });
    }
  }, [loading, role, navigate]);

  const projectsQuery = useQuery({
    queryKey: ["admin", "projects"],
    queryFn: () => fetchProjects(),
    enabled: role === "admin",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "projects"] });

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; id?: string }) =>
      values.id
        ? editProject({ data: { name: values.name, id: values.id } })
        : addProject({ data: { name: values.name } }),
    onSuccess: () => {
      setOpen(false);
      setName("");
      setError(null);
      setSuccess(editingId ? "Projekt aktualisiert." : "Projekt angelegt.");
      setEditingId(null);
      invalidate();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("Projektnamen")
          ? message
          : "Projekt konnte nicht gespeichert werden. Bitte erneut versuchen.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeProject({ data: { id } }),
    onSuccess: () => {
      setSuccess("Projekt gelöscht.");
      invalidate();
    },
  });

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const openEdit = (project: ProjectRow) => {
    setEditingId(project.id);
    setName(project.name);
    setError(null);
    setSuccess(null);
    setOpen(true);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim()) {
      setError("Bitte einen Projektnamen eingeben.");
      return;
    }

    saveMutation.mutate(editingId ? { name, id: editingId } : { name });
  };

  const handleDelete = (project: ProjectRow) => {
    if (!window.confirm(`Projekt „${project.name}" wirklich löschen?`)) return;
    setSuccess(null);
    deleteMutation.mutate(project.id);
  };

  const projects = projectsQuery.data ?? [];
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return projects;
    return projects.filter((project) =>
      project.name.toLowerCase().includes(term),
    );
  }, [projects, search]);

  return (
    <PanelShell
      title="Projekte"
      subtitle="Projekte anlegen und verwalten"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={nav}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Projekte
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ein Projekt braucht nur einen Namen, z. B. „LIMEX".
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suchen …"
            className="h-10 w-48"
            aria-label="Projekte durchsuchen"
          />
          <Button type="button" onClick={openCreate} className="rounded-full">
            <Plus className="h-4 w-4" aria-hidden="true" />
            Projekt hinzufügen
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
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Projektname</th>
                <th className="px-5 py-3 font-semibold">Angelegt am</th>
                <th className="px-5 py-3 font-semibold text-right">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {projectsQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={3}>
                    Wird geladen …
                  </td>
                </tr>
              ) : projectsQuery.isError ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={3}>
                    Projekte konnten nicht geladen werden.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={3}>
                    {projects.length === 0
                      ? "Noch keine Projekte vorhanden."
                      : "Keine Treffer für diese Suche."}
                  </td>
                </tr>
              ) : (
                filtered.map((project) => (
                  <tr key={project.id} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-4 font-medium text-foreground">
                      {project.name}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDate(project.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(project)}
                          aria-label="Bearbeiten"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(project)}
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Projekt bearbeiten" : "Projekt hinzufügen"}
            </DialogTitle>
            <DialogDescription>
              Nur der Projektname ist nötig, z. B. „LIMEX".
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project_name">Projektname</Label>
              <Input
                id="project_name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="LIMEX"
                required
                autoFocus
              />
            </div>

            {error ? (
              <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending
                ? "Wird gespeichert …"
                : editingId
                  ? "Änderungen speichern"
                  : "Projekt anlegen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
