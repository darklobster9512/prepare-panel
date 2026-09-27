import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Banknote, CheckCircle2, ChevronLeft, ChevronRight, Wallet, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

import { AuftragLogo } from "@/components/auftrag-logo";
import { PanelShell } from "@/components/panel-shell";
import { useAuth } from "@/hooks/use-auth";
import { getMyAbrechnung } from "@/lib/abrechnung.functions";
import { mitarbeiterNav } from "@/lib/mitarbeiter-nav";

export const Route = createFileRoute("/_authenticated/mitarbeiter/abrechnung")({
  head: () => ({
    meta: [
      { title: "Abrechnung – Mitarbeiter-Panel | IdentPanel" },
      {
        name: "description",
        content: "Dein Guthaben und der Verlauf deiner Vergütung pro erledigtem Auftrag.",
      },
      { property: "og:title", content: "Abrechnung – Mitarbeiter-Panel | IdentPanel" },
      {
        property: "og:description",
        content: "Dein Guthaben und der Verlauf deiner Vergütung pro erledigtem Auftrag.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AbrechnungPage,
});

const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "–";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ENTRIES_PER_PAGE = 20;

function AbrechnungPage() {
  const navigate = useNavigate();
  const { profile, role, loading } = useAuth();
  const fetchAbrechnung = useServerFn(getMyAbrechnung);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!loading && role === "admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [loading, role, navigate]);

  const abrechnungQuery = useQuery({
    queryKey: ["mitarbeiter", "abrechnung"],
    queryFn: () => fetchAbrechnung(),
  });

  // Bei jedem frisch geladenen Verlauf wieder auf Seite 1 starten.
  useEffect(() => {
    setPage(1);
  }, [abrechnungQuery.dataUpdatedAt]);

  const data = abrechnungQuery.data;
  const totalEntries = data?.entries.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalEntries / ENTRIES_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pagedEntries = data ? data.entries.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE) : [];

  return (
    <PanelShell
      title="Abrechnung"
      subtitle="Dein Guthaben und Verdienst"
      roleLabel="Mitarbeiter"
      userName={profile?.email || "Mitarbeiter"}
      nav={mitarbeiterNav(profile?.onboarding_enabled)}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border border-border bg-card px-5 py-7 shadow-sm sm:px-10">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Aktuelles Guthaben
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {data ? eur.format(data.balance_cents / 100) : "…"}
              </p>
            </div>
          </div>
          {data && (
            <div className="mt-5 flex flex-wrap gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 font-medium text-emerald-600">
                <CheckCircle2 className="h-4 w-4" />
                {data.success_count}× erfolgreich
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 font-medium text-destructive">
                <XCircle className="h-4 w-4" />
                {data.failed_count}× fehlgeschlagen
              </span>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-border bg-card px-5 py-7 shadow-sm sm:px-10">
          <h2 className="text-base font-bold tracking-tight text-foreground">Verlauf</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Erfolgreich: 5,00 € · Fehlgeschlagen: 2,50 €
          </p>

          {abrechnungQuery.isLoading && (
            <p className="mt-6 text-sm text-muted-foreground">Verlauf wird geladen …</p>
          )}
          {abrechnungQuery.isError && (
            <p className="mt-6 text-sm text-destructive">
              Der Verlauf konnte nicht geladen werden.
            </p>
          )}
          {data && data.entries.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Noch keine abgerechneten Aufträge vorhanden.
            </p>
          )}

          {data && pagedEntries.length > 0 && (
            <ul className="mt-4 divide-y divide-border">
              {pagedEntries.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 py-3">
                  {entry.kind === "auszahlung" ? (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-primary/10 text-primary">
                      <Banknote className="h-5 w-5" aria-hidden="true" />
                    </span>
                  ) : (
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary/40">
                      <AuftragLogo
                        value={entry.logo_path}
                        alt={entry.auftrag_name}
                        className="h-full w-full object-contain"
                        fallback={
                          <span className="text-xs font-bold text-muted-foreground">
                            {entry.auftrag_name.slice(0, 2).toUpperCase()}
                          </span>
                        }
                      />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {entry.auftrag_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {entry.kind === "auszahlung"
                        ? formatDate(entry.date)
                        : `${entry.vic_name} · ${formatDate(entry.date)}`}
                    </p>
                  </div>
                  <span
                    className={
                      entry.result === "erfolgreich"
                        ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600"
                        : entry.result === "auszahlung"
                          ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                          : "inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive"
                    }
                  >
                    {entry.result === "erfolgreich"
                      ? "Erfolgreich"
                      : entry.result === "auszahlung"
                        ? "Auszahlung"
                        : "Fehlgeschlagen"}
                  </span>
                  <span className="w-20 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">
                    {entry.amount_cents >= 0 ? "+" : "−"}
                    {eur.format(Math.abs(entry.amount_cents) / 100)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </PanelShell>
  );
}
