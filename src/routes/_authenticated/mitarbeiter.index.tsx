import { createFileRoute } from "@tanstack/react-router";
import { CalendarDays, CheckSquare, FileText, LayoutDashboard } from "lucide-react";

import { PanelShell, StatCard } from "@/components/panel-shell";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/mitarbeiter/")({
  head: () => ({
    meta: [
      { title: "Mitarbeiter-Panel – Interne Prozessvorbereitung" },
      {
        name: "description",
        content: "Persönliche Aufgaben, Fristen und Dokumente auf einen Blick.",
      },
      {
        property: "og:title",
        content: "Mitarbeiter-Panel – Interne Prozessvorbereitung",
      },
      {
        property: "og:description",
        content: "Persönliche Aufgaben, Fristen und Dokumente auf einen Blick.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: EmployeePanel,
});

const tasks = [
  { title: "Onboarding-Checkliste ausfüllen", due: "Heute", status: "Offen" },
  { title: "Arbeitsvertrag gegenzeichnen", due: "Morgen", status: "In Arbeit" },
  { title: "Datenschutzschulung abschliessen", due: "Freitag", status: "Offen" },
  { title: "Zeiterfassung Vorwoche prüfen", due: "Erledigt", status: "Erledigt" },
];

const documents = [
  { name: "Mitarbeiterhandbuch.pdf", meta: "Aktualisiert vor 2 Tagen" },
  { name: "Prozessübersicht_Einkauf.pdf", meta: "Aktualisiert vor 1 Woche" },
  { name: "IT-Richtlinien.pdf", meta: "Aktualisiert vor 3 Wochen" },
];

function EmployeePanel() {
  const { profile } = useAuth();
  const firstName = profile?.first_name || "willkommen";
  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "Mitarbeitende:r";

  return (
    <PanelShell
      title={`Hallo ${firstName}`}
      subtitle="Ihre Aufgaben und Unterlagen im Überblick"
      roleLabel="Mitarbeiter"
      userName={userName}
      nav={[
        { label: "Übersicht", icon: LayoutDashboard, active: true },
        { label: "Meine Aufgaben", icon: CheckSquare },
        { label: "Termine", icon: CalendarDays },
        { label: "Dokumente", icon: FileText },
      ]}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Meine Aufgaben" value="6" hint="2 mit hoher Priorität" />
        <StatCard label="Fällig diese Woche" value="3" hint="Nächste Frist: Freitag" />
        <StatCard label="Erledigt" value="18" hint="In den letzten 30 Tagen" />
      </div>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold tracking-tight text-foreground">Aufgabenliste</h2>
        <ul className="mt-5 space-y-3">
          {tasks.map((task) => (
            <li
              key={task.title}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background px-4 py-3.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                    task.status === "Erledigt"
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                  aria-hidden="true"
                >
                  {task.status === "Erledigt" && <CheckSquare className="h-3 w-3" />}
                </span>
                <span
                  className={`text-sm font-medium ${
                    task.status === "Erledigt"
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {task.title}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-muted-foreground">{task.due}</span>
                <span className="rounded-full bg-secondary px-3 py-1 font-semibold text-secondary-foreground">
                  {task.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-bold tracking-tight text-foreground">
          Dokumente &amp; Vorbereitung
        </h2>
        <ul className="mt-5 divide-y divide-border">
          {documents.map((doc) => (
            <li key={doc.name} className="flex items-center gap-3 py-3.5">
              <FileText className="h-4.5 w-4.5 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm font-medium text-foreground">{doc.name}</p>
                <p className="text-xs text-muted-foreground">{doc.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </PanelShell>
  );
}
