import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { PanelShell } from "@/components/panel-shell";
import { useAuth } from "@/hooks/use-auth";
import { mitarbeiterNav } from "@/lib/mitarbeiter-nav";

export const Route = createFileRoute("/_authenticated/mitarbeiter/informationen")({
  head: () => ({
    meta: [
      { title: "Informationen – Mitarbeiter-Panel | IdentPanel" },
      {
        name: "description",
        content:
          "Vorgaben für Identvorgänge: welche Daten verwendet werden und welche Angaben bei den Banken zu machen sind.",
      },
      { property: "og:title", content: "Informationen – Mitarbeiter-Panel | IdentPanel" },
      {
        property: "og:description",
        content:
          "Vorgaben für Identvorgänge: welche Daten verwendet werden und welche Angaben bei den Banken zu machen sind.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: InformationenPage,
});

function Section({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-8">
      <div className="flex items-baseline gap-3">
        <span className="flex h-7 w-7 shrink-0 translate-y-0.5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {index}
        </span>
        <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="mt-3 space-y-3 pl-10 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

const RULES: { label: string; value: React.ReactNode }[] = [
  { label: "Beschäftigung", value: <>Immer <strong className="text-foreground">Angestellter</strong> wählen.</> },
  { label: "Branche", value: <>Beliebig – wähle etwas Zufälliges aus.</> },
  {
    label: "Personen ab 65 Jahren",
    value: (
      <>
        Als Beschäftigung immer <strong className="text-foreground">Rentner</strong> wählen.
      </>
    ),
  },
  {
    label: "Gehalt / monatliches Einkommen",
    value: (
      <>
        Immer ein Wert zwischen <strong className="text-foreground">2.000 € und 2.500 €</strong>.
      </>
    ),
  },
  {
    label: "Beschäftigt seit",
    value: (
      <>
        Immer <strong className="text-foreground">5 Jahre oder länger</strong> (z. B. 03.2020
        oder 06.2018).
      </>
    ),
  },
  {
    label: "Wohnsituation",
    value: (
      <>
        Immer <strong className="text-foreground">Mietwohnung / zur Miete</strong> angeben.
      </>
    ),
  },
  {
    label: "Wohnort-Dauer",
    value: (
      <>
        Zwischen <strong className="text-foreground">3 und 15 Jahren</strong>, je nach Alter der
        Person – aber niemals kürzer als 3 Jahre.
      </>
    ),
  },
  {
    label: "Falls nach der Miete gefragt wird",
    value: (
      <>
        Immer ein Wert zwischen <strong className="text-foreground">700 € und 900 €</strong>.
      </>
    ),
  },
];

function InformationenPage() {
  const navigate = useNavigate();
  const { profile, role, loading } = useAuth();

  useEffect(() => {
    if (!loading && role === "admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [loading, role, navigate]);

  return (
    <PanelShell
      title="Informationen"
      subtitle="Vorgaben für Identvorgänge"
      roleLabel="Mitarbeiter"
      userName={profile?.email || "Mitarbeiter"}
      nav={mitarbeiterNav(profile?.onboarding_enabled)}
    >
      <article className="mx-auto max-w-3xl rounded-xl border border-border bg-card px-5 py-7 shadow-sm sm:px-12 sm:py-12">
        <header className="flex flex-col items-start gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-left sm:text-right">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              Informationen
            </h2>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Vorgaben für Identvorgänge
            </p>
          </div>
        </header>

        <Section index={1} title="Deine Aufgabe">
          <p>
            Du bereitest für uns die Identvorgänge vor. Verwende dafür immer
            ausschließlich die Daten, die wir dir pro Vorgang zur Verfügung
            stellen – den Datensatz, die generierten Daten, das E-Mail-Konto und
            die Telefonnummer. Erfinde nichts selbst und nutze niemals echte
            fremde Daten.
          </p>
        </Section>

        <Section index={2} title="Formularangaben bei den Banken">
          <p>
            Bei den meisten Banken müssen im Verlauf der Registrierung
            zusätzliche Angaben gemacht werden, zum Beispiel zur Beschäftigung
            oder zur Wohnsituation. Dafür gelten die folgenden festen Regeln:
          </p>
          <dl className="mt-2 divide-y divide-border overflow-hidden rounded-xl border border-border">
            {RULES.map((rule) => (
              <div
                key={rule.label}
                className="grid gap-1 bg-secondary/40 px-4 py-3 sm:grid-cols-[minmax(0,14rem)_1fr] sm:gap-4"
              >
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {rule.label}
                </dt>
                <dd className="text-sm leading-relaxed">{rule.value}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section index={3} title="Merke">
          <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
            Im Zweifel gelten immer diese Vorgaben. Bei Fragen sprich uns an.
          </p>
        </Section>

        <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          IdentPanel · Informationen
        </footer>
      </article>
    </PanelShell>
  );
}
