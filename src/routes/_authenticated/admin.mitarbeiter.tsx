import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Eye, EyeOff, FolderKanban, IdCard, LayoutDashboard, Phone, Plus, Users } from "lucide-react";
import { useEffect, useState } from "react";

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
import { createEmployee, listEmployees } from "@/lib/admin-users.functions";

export const Route = createFileRoute("/_authenticated/admin/mitarbeiter")({
  head: () => ({
    meta: [
      { title: "Mitarbeiterverwaltung – Admin-Panel" },
      {
        name: "description",
        content: "Mitarbeiterkonten anlegen und verwalten.",
      },
      { property: "og:title", content: "Mitarbeiterverwaltung – Admin-Panel" },
      {
        property: "og:description",
        content: "Mitarbeiterkonten anlegen und verwalten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEmployees,
});

function AdminEmployees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchEmployees = useServerFn(listEmployees);
  const addEmployee = useServerFn(createEmployee);

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/mitarbeiter", replace: true });
    }
  }, [loading, role, navigate]);

  const employeesQuery = useQuery({
    queryKey: ["admin", "employees"],
    queryFn: () => fetchEmployees(),
    enabled: role === "admin",
  });

  const mutation = useMutation({
    mutationFn: (values: { email: string; password: string }) =>
      addEmployee({ data: values }),
    onSuccess: () => {
      setOpen(false);
      setEmail("");
      setPassword("");
      setError(null);
      setSuccess("Konto angelegt.");
      queryClient.invalidateQueries({ queryKey: ["admin", "employees"] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("bereits") ||
          message.includes("Passwort") ||
          message.includes("E-Mail")
          ? message
          : "Konto konnte nicht angelegt werden. Bitte erneut versuchen.",
      );
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Bitte eine gültige E-Mail-Adresse eingeben.");
      return;
    }
    if (password.length < 6) {
      setError("Das Passwort muss mindestens 6 Zeichen haben.");
      return;
    }

    mutation.mutate({ email: email.trim(), password });
  };

  const userName = profile?.email || "Administrator";
  const employees = employeesQuery.data ?? [];

  return (
    <PanelShell
      title="Mitarbeiter"
      subtitle="Konten anlegen und verwalten"
      roleLabel="Administrator"
      userName={userName}
      nav={[
        { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
        { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
        { label: "Vics", icon: IdCard, to: "/admin/vics" },
        { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
        { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
      ]}

    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Mitarbeiterkonten
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Neue Konten erhalten automatisch den Rang „Mitarbeiter" und sind sofort
            nutzbar.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setError(null);
            setSuccess(null);
            setOpen(true);
          }}
          className="rounded-full"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Mitarbeiter hinzufügen
        </Button>
      </div>

      {success ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
          {success}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">E-Mail</th>
                <th className="px-6 py-3 font-semibold">Rolle</th>
                <th className="px-6 py-3 font-semibold">Erstellt</th>
              </tr>
            </thead>
            <tbody>
              {employeesQuery.isLoading ? (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={3}>
                    Wird geladen …
                  </td>
                </tr>
              ) : employeesQuery.isError ? (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={3}>
                    Konten konnten nicht geladen werden.
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td className="px-6 py-6 text-muted-foreground" colSpan={3}>
                    Noch keine Konten vorhanden.
                  </td>
                </tr>
              ) : (
                employees.map((person) => (
                  <tr
                    key={person.user_id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-6 py-4 font-medium text-foreground">
                      {person.email || "–"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                        {person.role === "admin" ? "Admin" : "Mitarbeiter"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {new Date(person.created_at).toLocaleDateString("de-DE")}
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
            <DialogTitle>Mitarbeiter hinzufügen</DialogTitle>
            <DialogDescription>
              E-Mail und Passwort genügen. Die Rolle „Mitarbeiter" wird automatisch
              vergeben.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-email">E-Mail</Label>
              <Input
                id="new-email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@firma.de"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-password">Passwort</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="mindestens 6 Zeichen"
                  className="pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error ? (
              <p className="flex items-start gap-2 text-sm font-medium text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              disabled={mutation.isPending}
              className="w-full rounded-full"
            >
              {mutation.isPending ? "Wird angelegt …" : "Konto anlegen"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
