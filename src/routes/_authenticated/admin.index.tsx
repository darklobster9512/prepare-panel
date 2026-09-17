import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { FolderKanban, IdCard, LayoutDashboard, Phone, Users } from "lucide-react";
import { useEffect } from "react";

import { PanelShell, StatCard } from "@/components/panel-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Admin-Panel – Interne Prozessvorbereitung" },
      {
        name: "description",
        content: "Übersicht über Mitarbeitende, Prozesse und Freigaben.",
      },
      { property: "og:title", content: "Admin-Panel – Interne Prozessvorbereitung" },
      {
        property: "og:description",
        content: "Übersicht über Mitarbeitende, Prozesse und Freigaben.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPanel,
});

const users = [
  { name: "Lena Hoffmann", email: "l.hoffmann@firma.de", role: "Admin", status: "Aktiv" },
  { name: "Tobias Krüger", email: "t.krueger@firma.de", role: "Mitarbeiter", status: "Aktiv" },
  { name: "Sara Bauer", email: "s.bauer@firma.de", role: "Mitarbeiter", status: "Eingeladen" },
  { name: "Jonas Weber", email: "j.weber@firma.de", role: "Mitarbeiter", status: "Aktiv" },
  { name: "Mira Schulz", email: "m.schulz@firma.de", role: "Mitarbeiter", status: "Inaktiv" },
];

const processes = [
  { name: "Onboarding-Prozess 2026", progress: 82 },
  { name: "Dokumentenfreigabe Einkauf", progress: 64 },
  { name: "Datenschutz-Review", progress: 45 },
  { name: "Schulungsplan Q4", progress: 21 },
];

function AdminPanel() {
  const navigate = useNavigate();
  const { role, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/mitarbeiter", replace: true });
    }
  }, [loading, role, navigate]);

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "Administrator";

  return (
    <PanelShell
      title="Admin-Panel"
      subtitle="Übersicht über Team, Prozesse und Freigaben"
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mitarbeitende" value="24" hint="+3 in diesem Monat" />
        <StatCard label="Offene Prozesse" value="12" hint="4 mit Frist diese Woche" />
        <StatCard label="Abgeschlossen" value="87" hint="Seit Jahresbeginn" />
        <StatCard label="Offene Freigaben" value="5" hint="Warten auf Admin" />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card shadow-sm">
        <header className="border-b border-border px-6 py-5">
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Benutzerverwaltung
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Beispieldaten – Funktionen folgen später
          </p>
        </header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-6 py-3 font-semibold">Name</th>
                <th className="px-6 py-3 font-semibold">E-Mail</th>
                <th className="px-6 py-3 font-semibold">Rolle</th>
                <th className="px-6 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.email} className="border-b border-border/60 last:border-0">
                  <td className="px-6 py-4 font-medium text-foreground">{user.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-primary/12 px-3 py-1 text-xs font-semibold text-primary">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{user.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Laufende Unternehmensprozesse
        </h2>
        <ul className="mt-5 space-y-5">
          {processes.map((process) => (
            <li key={process.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{process.name}</span>
                <span className="text-muted-foreground">{process.progress}%</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${process.progress}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PanelShell>
  );
}
