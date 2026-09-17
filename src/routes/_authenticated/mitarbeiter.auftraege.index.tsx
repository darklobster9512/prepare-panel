import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CalendarDays,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Phone,
} from "lucide-react";
import { useState } from "react";

import { PanelShell } from "@/components/panel-shell";
import { AuftragLogo } from "@/components/auftrag-logo";
import { useAuth } from "@/hooks/use-auth";
import { statusLabel, statusRingClass } from "@/lib/auftrag-status";
import { claimVic, listWorkItems } from "@/lib/mitarbeiter.functions";
import type { WorkItem } from "@/lib/mitarbeiter.types";

export const Route = createFileRoute("/_authenticated/mitarbeiter/auftraege/")({
  head: () => ({
    meta: [
      { title: "Aufträge – Mitarbeiter-Panel | IdentPanel" },
      {
        name: "description",
        content: "Verfügbare Datensätze beanspruchen und Aufträge Schritt für Schritt abarbeiten.",
      },
      { property: "og:title", content: "Aufträge – Mitarbeiter-Panel | IdentPanel" },
      {
        property: "og:description",
        content: "Verfügbare Datensätze beanspruchen und Aufträge Schritt für Schritt abarbeiten.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: MitarbeiterAuftraege,
});

function formatDate(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE");
}

function MitarbeiterAuftraege() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const listFn = useServerFn(listWorkItems);
  const claimFn = useServerFn(claimVic);

  const itemsQuery = useQuery({
    queryKey: ["mitarbeiter", "work-items"],
    queryFn: () => listFn(),
    enabled: !loading,
  });

  const claimMutation = useMutation({
    mutationFn: (vicId: string) => claimFn({ data: { vic_id: vicId } }),
    onSuccess: (_data, vicId) => {
      queryClient.invalidateQueries({ queryKey: ["mitarbeiter", "work-items"] });
      navigate({ to: "/mitarbeiter/auftraege/$vicId", params: { vicId } });
    },
    onError: (err: Error) => setError(err.message),
  });

  const items = itemsQuery.data ?? [];
  const mine = items.filter((item) => item.claimed_by === user?.id && !item.completed_at);
  const done = items.filter((item) => item.claimed_by === user?.id && item.completed_at);
  const available = items.filter((item) => !item.claimed_by);
  const taken = items.filter((item) => item.claimed_by && item.claimed_by !== user?.id);

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "Mitarbeitende:r";

  return (
    <PanelShell
      title="Aufträge"
      subtitle="Datensätze beanspruchen und Aufträge abarbeiten"
      roleLabel="Mitarbeiter"
      userName={userName}
      nav={[
        { label: "Übersicht", icon: LayoutDashboard, to: "/mitarbeiter", exact: true },
        { label: "Aufträge", icon: ClipboardList, to: "/mitarbeiter/auftraege" },
        { label: "Termine", icon: CalendarDays },
        { label: "Dokumente", icon: FileText },
      ]}
    >
      {error ? (
        <p className="mb-4 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      {itemsQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Wird geladen …</p>
      ) : itemsQuery.isError ? (
        <p className="text-sm text-destructive">
          {(itemsQuery.error as Error)?.message ?? "Aufträge konnten nicht geladen werden."}
        </p>
      ) : (
        <div className="space-y-10">
          <Section
            title="Meine Aufträge"
            empty="Du hast aktuell keine Datensätze in Arbeit."
            items={mine}
            action={(item) => (
              <Link
                to="/mitarbeiter/auftraege/$vicId"
                params={{ vicId: item.id }}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                {item.auftraege.length > 0 && item.auftraege.every((a) => a.status !== "offen")
                  ? "Abschließen"
                  : "Weiterarbeiten"}
              </Link>
            )}
          />

          <Section
            title="Verfügbar"
            empty="Zurzeit gibt es keine freien Datensätze."
            items={available}
            action={(item) => (
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  claimMutation.mutate(item.id);
                }}
                disabled={claimMutation.isPending}
                className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {claimMutation.isPending && claimMutation.variables === item.id
                  ? "Wird beansprucht …"
                  : "Beanspruchen"}
              </button>
            )}
          />

          <Section
            title="Abgeschlossen"
            empty="Noch nichts abgeschlossen."
            items={done}
            action={(item) => (
              <Link
                to="/mitarbeiter/auftraege/$vicId"
                params={{ vicId: item.id }}
                className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
              >
                Ansehen
              </Link>
            )}
          />

          {taken.length > 0 ? (
            <Section
              title="Von anderen in Arbeit"
              empty=""
              items={taken}
              action={() => (
                <span className="text-xs font-semibold text-muted-foreground">
                  Bereits beansprucht
                </span>
              )}
            />
          ) : null}
        </div>
      )}
    </PanelShell>
  );
}

function Section({
  title,
  empty,
  items,
  action,
}: {
  title: string;
  empty: string;
  items: WorkItem[];
  action: (item: WorkItem) => React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-lg font-bold tracking-tight text-foreground">
        {title}
        <span className="ml-2 text-sm font-semibold text-muted-foreground">
          {items.length}
        </span>
      </h2>

      {items.length === 0 ? (
        empty ? (
          <p className="mt-3 text-sm text-muted-foreground">{empty}</p>
        ) : null
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <h3 className="text-base font-bold tracking-tight text-foreground">
                {item.first_name} {item.last_name}
              </h3>
              {item.completed_at ? (
                <p className="mt-1 inline-flex w-fit items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-600">
                  Abgeschlossen am {formatDate(item.completed_at)}
                </p>
              ) : null}
              <dl className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex gap-2">
                  <dt>Geburtsdatum:</dt>
                  <dd className="text-foreground">{formatDate(item.birth_date)}</dd>
                </div>
                <div className="flex gap-2">
                  <dt>Geburtsort:</dt>
                  <dd className="text-foreground">{item.birth_place || "–"}</dd>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                  <dd className="text-foreground">{item.phone_number || "Keine Nummer"}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {item.auftraege.map((auftrag) => (
                  <span
                    key={auftrag.id}
                    title={`${auftrag.name} · ${statusLabel(auftrag.status, Boolean(item.claimed_by))}`}
                    className={`inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-background ${statusRingClass(
                      auftrag.status,
                      Boolean(item.claimed_by),
                    )}`}
                  >
                    <AuftragLogo
                      value={auftrag.logo_path}
                      alt={auftrag.name}
                      className="h-full w-full object-contain p-1"
                      fallback={
                        <span className="text-[0.6rem] font-semibold text-muted-foreground">
                          {auftrag.name.slice(0, 2).toUpperCase()}
                        </span>
                      }
                    />
                  </span>
                ))}
              </div>

              <div className="mt-5 flex justify-end">{action(item)}</div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
