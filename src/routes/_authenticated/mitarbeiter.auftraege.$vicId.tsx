import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  Check,
  ClipboardCheck,
  Info,
  MessageSquare,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { AuftragLogo, preloadAuftragFiles } from "@/components/auftrag-logo";
import { CopyButton } from "@/components/copy-button";
import { PanelShell } from "@/components/panel-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { mitarbeiterNav } from "@/lib/mitarbeiter-nav";
import { statusLabel, statusRingClass } from "@/lib/auftrag-status";
import {
  completeAuftrag,
  ensureEmailIdentity,
  finishVic,
  getWorkItem,
  listVicSms,
  saveEmailAddress,
} from "@/lib/mitarbeiter.functions";
import type { WorkAuftrag, WorkItem } from "@/lib/mitarbeiter.types";

export const Route = createFileRoute("/_authenticated/mitarbeiter/auftraege/$vicId")({
  head: () => ({
    meta: [
      { title: "Auftrag bearbeiten – Mitarbeiter-Panel | IdentPanel" },
      {
        name: "description",
        content: "Datensatz, Telefonnummer, SMS und Zugangsdaten für die Auftragsbearbeitung.",
      },
      { property: "og:title", content: "Auftrag bearbeiten – Mitarbeiter-Panel | IdentPanel" },
      {
        property: "og:description",
        content: "Datensatz, Telefonnummer, SMS und Zugangsdaten für die Auftragsbearbeitung.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WizardPage,
});

const inputClass =
  "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary";
const labelClass = "text-xs font-semibold text-muted-foreground";

function formatDate(value: string | null) {
  if (!value) return "–";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("de-DE");
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("de-DE");
}

function isEmailAuftrag(auftrag: WorkAuftrag) {
  return auftrag.ident_type === "email";
}

type FieldConfig = {
  credentials: boolean;
  webid: boolean;
  postident: boolean;
};

function fieldsFor(auftrag: WorkAuftrag): FieldConfig {
  const name = auftrag.name.toLowerCase();
  if (isEmailAuftrag(auftrag)) return { credentials: false, webid: false, postident: false };
  if (name.includes("bbva")) return { credentials: true, webid: false, postident: false };
  if (name.includes("dkb")) return { credentials: true, webid: true, postident: false };
  if (name.includes("deutsche bank"))
    return { credentials: false, webid: true, postident: false };
  if (auftrag.ident_type === "postident")
    return { credentials: false, webid: false, postident: true };
  if (auftrag.ident_type === "videoident")
    return { credentials: false, webid: true, postident: false };
  return { credentials: false, webid: false, postident: false };
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (value: string) => {
    void navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };
  return [copied, copy] as const;
}

function CopyText({
  value,
  label,
  className = "",
}: {
  value: string;
  label: string;
  className?: string;
}) {
  const [copied, copy] = useCopy();
  return (
    <span className="inline-flex min-w-0 items-center gap-1">
      <button
        type="button"
        aria-label={`${label} kopieren`}
        title="Klicken zum Kopieren"
        onClick={() => copy(value)}
        className={`group/copy inline-flex min-w-0 cursor-copy items-center gap-1 rounded-md outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring ${className}`}
      >
        <span className="min-w-0 truncate">{value}</span>
        {copied ? (
          <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
        ) : null}
      </button>
      <CopyButton value={value} label={label} />
    </span>
  );
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, copy] = useCopy();
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 inline-flex items-center gap-1">
        <button
          type="button"
          aria-label={`${label} kopieren`}
          title="Klicken zum Kopieren"
          onClick={() => copy(value)}
          className="group/copy inline-flex cursor-copy items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {value}
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          ) : null}
        </button>
        <CopyButton value={value} label={label} />
      </div>
    </div>
  );
}


function WizardPage() {
  const { vicId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading } = useAuth();

  const getItemFn = useServerFn(getWorkItem);
  const smsFn = useServerFn(listVicSms);
  const ensureIdentityFn = useServerFn(ensureEmailIdentity);
  const saveEmailFn = useServerFn(saveEmailAddress);
  const completeFn = useServerFn(completeAuftrag);

  const itemQuery = useQuery({
    queryKey: ["mitarbeiter", "work-item", vicId],
    queryFn: () => getItemFn({ data: { vic_id: vicId } }),
    enabled: !loading,
  });

  const item = itemQuery.data ?? null;
  const isMine = Boolean(item && user && item.claimed_by === user.id);

  const [smsCountdown, setSmsCountdown] = useState(5);

  const smsQuery = useQuery({
    queryKey: ["mitarbeiter", "sms", vicId],
    queryFn: () => smsFn({ data: { vic_id: vicId } }),
    enabled: Boolean(item?.phone_order_booking_id),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  const smsActive = Boolean(item?.phone_order_booking_id);
  const smsUpdatedAt = smsQuery.dataUpdatedAt;
  useEffect(() => {
    if (!smsActive) return;
    setSmsCountdown(5);
    const interval = window.setInterval(() => {
      setSmsCountdown((prev) => (prev <= 1 ? 5 : prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
    // Bei jedem frischen SMS-Abruf zählt der Timer wieder von vorn.
  }, [smsActive, smsUpdatedAt]);

  const setItem = (next: WorkItem) =>
    queryClient.setQueryData(["mitarbeiter", "work-item", vicId], next);

  const identityMutation = useMutation({
    mutationFn: () => ensureIdentityFn({ data: { vic_id: vicId } }),
    onSuccess: setItem,
  });

  // Fantasie-Identität einmalig erzeugen, sobald ein E-Mail-Auftrag ansteht.
  const needsIdentity =
    isMine &&
    Boolean(item) &&
    item!.auftraege.some(isEmailAuftrag) &&
    (!item!.email_street || !item!.email_birth_date);

  useEffect(() => {
    if (needsIdentity && !identityMutation.isPending) identityMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsIdentity]);

  const steps = item?.auftraege ?? [];
  const assetPaths = useMemo(
    () => steps.flatMap((auftrag) => [auftrag.logo_path, ...auftrag.images]),
    [steps],
  );
  const assetsQuery = useQuery({
    queryKey: ["mitarbeiter", "work-item-assets", vicId, assetPaths.join("|")],
    queryFn: () => preloadAuftragFiles(assetPaths),
    enabled: Boolean(item) && assetPaths.length > 0,
    staleTime: Infinity,
  });
  const loadingAssets = Boolean(item) && assetPaths.length > 0 && assetsQuery.isPending;
  const openCount = steps.filter((step) => step.status === "offen").length;
  const allDone = steps.length > 0 && openCount === 0;
  const isCompleted = Boolean(item?.completed_at);
  const firstOpen = steps.findIndex((step) => step.status === "offen");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const fallbackIndex = firstOpen >= 0 ? firstOpen : allDone ? steps.length : 0;
  const current = activeIndex ?? fallbackIndex;
  const showSummary = steps.length > 0 && current >= steps.length;
  const step = showSummary ? null : (steps[current] ?? null);

  const finishFn = useServerFn(finishVic);
  const finishMutation = useMutation({
    mutationFn: () => finishFn({ data: { vic_id: vicId } }),
    onSuccess: (next) => {
      setItem(next);
      queryClient.invalidateQueries({ queryKey: ["mitarbeiter", "work-items"] });
      navigate({ to: "/mitarbeiter/auftraege" });
    },
  });

  const userName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    profile?.email ||
    "Mitarbeitende:r";

  return (
    <PanelShell
      title="Auftrag bearbeiten"
      subtitle={item ? `${item.first_name} ${item.last_name}` : "Wird geladen …"}
      roleLabel="Mitarbeiter"
      userName={userName}
      nav={mitarbeiterNav(profile?.onboarding_enabled)}
    >
      <Link
        to="/mitarbeiter/auftraege"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Zurück zur Übersicht
      </Link>

      {itemQuery.isLoading || loadingAssets ? (
        <p className="mt-6 text-sm text-muted-foreground">Wird geladen …</p>
      ) : itemQuery.isError || !item ? (
        <p className="mt-6 text-sm text-destructive">
          {(itemQuery.error as Error)?.message ?? "Datensatz konnte nicht geladen werden."}
        </p>
      ) : (
        <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[22rem_minmax(0,1fr)]">
          <aside className="space-y-6">
            <VicCard item={item} />
            <PhoneCard
              item={item}
              sms={smsQuery.data ?? []}
              countdown={smsCountdown}
              onRefresh={() => {
                setSmsCountdown(5);
                smsQuery.refetch();
              }}
            />
          </aside>

          <div className="min-w-0 space-y-6">
            {!isMine ? (
              <p className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
                Dieser Datensatz ist dir nicht zugewiesen – du kannst ihn nur ansehen.
              </p>
            ) : null}

            {isCompleted ? (
              <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-foreground">
                Dieser Datensatz wurde am {formatDateTime(item.completed_at!)} abgeschlossen und
                kann nicht mehr geändert werden.
              </p>
            ) : null}

            <StepBar
              steps={steps}
              current={current}
              claimed={Boolean(item.claimed_by)}
              onSelect={setActiveIndex}
              summaryEnabled={allDone}
              openCount={openCount}
            />

            {showSummary ? (
              <SummaryCard
                item={item}
                canFinish={isMine && allDone && !isCompleted}
                pending={finishMutation.isPending}
                error={(finishMutation.error as Error | null)?.message ?? null}
                onFinish={() => finishMutation.mutate()}
              />
            ) : step ? (
              <StepCard
                key={step.id}
                item={item}
                step={step}
                editable={isMine && !isCompleted}
                onSaved={(next) => {
                  setItem(next);
                  queryClient.invalidateQueries({ queryKey: ["mitarbeiter", "work-items"] });
                  const nextOpen = next.auftraege.findIndex((a) => a.status === "offen");
                  setActiveIndex(nextOpen >= 0 ? nextOpen : next.auftraege.length);
                }}
                saveEmail={(email) =>
                  saveEmailFn({ data: { vic_id: vicId, email_address: email } })
                }
                complete={(payload) =>
                  completeFn({ data: { vic_id: vicId, auftrag_id: step.auftrag_id, ...payload } })
                }
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Diesem Datensatz sind noch keine Aufträge zugewiesen.
              </p>
            )}
          </div>
        </div>
      )}
    </PanelShell>
  );
}

function VicCard({ item }: { item: WorkItem }) {
  const rows: { label: string; value: string; copyable: boolean }[] = [
    { label: "Vorname(n)", value: item.first_name || "–", copyable: true },
    { label: "Nachname", value: item.last_name || "–", copyable: true },
    { label: "Geburtsname", value: item.birth_name || "–", copyable: true },
    { label: "Geburtsdatum", value: formatDate(item.birth_date), copyable: true },
    { label: "Geburtsort", value: item.birth_place || "–", copyable: true },
    { label: "Straße", value: item.street || "–", copyable: true },
    { label: "PLZ", value: item.postal_code || "–", copyable: true },
    { label: "Ort", value: item.city || "–", copyable: true },
    { label: "Familienstand", value: item.marital_status || "–", copyable: false },
    { label: "Steuer-ID", value: item.tax_id || "–", copyable: false },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h2 className="text-base font-bold tracking-tight text-foreground">
        {item.first_name} {item.last_name}
      </h2>
      <dl className="mt-4 space-y-2 text-sm">
        {rows.map((row) => (
          <div key={row.label} className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
            <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="flex min-w-0 items-center sm:justify-end">
              {row.copyable && row.value !== "–" ? (
                <CopyText
                  value={row.value}
                  label={row.label}
                  className="font-medium text-foreground hover:text-foreground sm:text-right"
                />
              ) : (
                <span className="break-words font-medium text-foreground sm:text-right">
                  {row.value}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
      {item.notes ? (
        <p className="mt-4 whitespace-pre-wrap rounded-xl bg-secondary px-3 py-2 text-xs text-secondary-foreground">
          {item.notes}
        </p>
      ) : null}
      {item.email_address ? (
        <div className="mt-4 border-t border-border pt-4">
          <CopyValue label="Erstellte E-Mail" value={item.email_address} />
        </div>
      ) : null}
    </section>
  );
}

function PhoneCard({
  item,
  sms,
  countdown,
  onRefresh,
}: {
  item: WorkItem;
  sms: { messageDate: string; messageSender: string; messageText: string }[];
  countdown: number;
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
          <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
          Telefonnummer
        </h2>
        <div className="flex items-center gap-2">
          {item.phone_order_booking_id ? (
            <span
              title="Neue SMS werden alle 5 Sekunden automatisch geladen"
              className="inline-flex h-8 min-w-8 items-center justify-center rounded-full border border-border bg-secondary px-2 text-xs font-bold tabular-nums text-foreground"
            >
              {countdown}&nbsp;s
            </span>
          ) : null}
          <button
            type="button"
            onClick={onRefresh}
            aria-label="SMS aktualisieren"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {item.phone_number ? (
        <div className="mt-3 space-y-1">
          <CopyValue label="Nummer" value={item.phone_number} />
          <p className="text-xs text-muted-foreground">
            Gültig bis {formatDate(item.phone_end_date)}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          Diesem Datensatz ist noch keine Nummer zugewiesen.
        </p>
      )}

      <h3 className="mt-5 flex items-center gap-2 text-sm font-semibold text-foreground">
        <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
        Eingehende SMS
      </h3>
      {sms.length === 0 ? (
        <p className="mt-2 text-xs text-muted-foreground">Noch keine SMS empfangen.</p>
      ) : (
        <ul className="mt-2 space-y-2">
          {sms.map((message, index) => (
            <li
              key={`${message.messageDate}-${index}`}
              className="rounded-xl border border-border bg-background px-3 py-2"
            >
              <p className="flex flex-wrap justify-between gap-x-2 text-[0.7rem] text-muted-foreground">
                <span>{message.messageSender}</span>
                <span>{formatDateTime(message.messageDate)}</span>
              </p>
              <p className="mt-1 text-sm text-foreground">{message.messageText}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function StepBar({
  steps,
  current,
  claimed,
  onSelect,
  summaryEnabled,
  openCount,
}: {
  steps: WorkAuftrag[];
  current: number;
  claimed: boolean;
  onSelect: (index: number) => void;
  summaryEnabled: boolean;
  openCount: number;
}) {
  return (
    <div className="-mx-1 flex snap-x items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-sm sm:mx-0 sm:flex-wrap sm:gap-3 sm:rounded-2xl sm:p-4">
      {steps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          onClick={() => onSelect(index)}
          title={`${step.name} · ${statusLabel(step.status, claimed)}`}
          className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
            index === current ? "bg-secondary text-foreground" : "text-muted-foreground"
          }`}
        >
          <span
            className={`inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-background ${statusRingClass(
              step.status,
              claimed,
            )}`}
          >
            <AuftragLogo
              value={step.logo_path}
              alt={step.name}
              className="h-full w-full object-contain p-1"
              fallback={
                <span className="text-[0.6rem] font-semibold text-muted-foreground">
                  {step.name.slice(0, 2).toUpperCase()}
                </span>
              }
            />
          </span>
          {step.name}
        </button>
      ))}

      {steps.length > 0 ? (
        <button
          type="button"
          onClick={() => summaryEnabled && onSelect(steps.length)}
          disabled={!summaryEnabled}
          title={
            summaryEnabled
              ? "Zusammenfassung"
              : `Noch ${openCount} ${openCount === 1 ? "Auftrag" : "Aufträge"} offen`
          }
          className={`inline-flex shrink-0 snap-start items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            current >= steps.length ? "bg-secondary text-foreground" : "text-muted-foreground"
          }`}
        >
          <span
            className={`inline-flex h-9 w-9 items-center justify-center rounded-lg bg-background ${
              summaryEnabled ? "ring-2 ring-primary" : "ring-2 ring-border"
            }`}
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
          </span>
          Zusammenfassung
        </button>
      ) : null}
    </div>
  );
}

function SummaryCard({
  item,
  canFinish,
  pending,
  error,
  onFinish,
}: {
  item: WorkItem;
  canFinish: boolean;
  pending: boolean;
  error: string | null;
  onFinish: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const success = item.auftraege.filter((a) => a.status === "erfolgreich").length;
  const failed = item.auftraege.filter((a) => a.status === "fehlgeschlagen").length;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">Zusammenfassung</h2>
          <p className="text-xs text-muted-foreground">
            {success} erfolgreich · {failed} fehlgeschlagen
          </p>
        </div>
        {item.completed_at ? (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-600">
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
            Abgeschlossen
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Readonly label="Datensatz" value={`${item.first_name} ${item.last_name}`} />
        {item.phone_number ? (
          <Readonly label="Telefonnummer" value={item.phone_number} />
        ) : null}
        {item.email_address ? (
          <Readonly label="Erstellte E-Mail" value={item.email_address} />
        ) : null}
      </div>

      <ul className="mt-6 space-y-3">
        {item.auftraege.map((auftrag) => (
          <li
            key={auftrag.id}
            className="flex flex-wrap items-start gap-3 rounded-xl border border-border bg-background p-4"
          >
            <span
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-card ${statusRingClass(
                auftrag.status,
                true,
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

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{auftrag.name}</p>
              <dl className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                {auftrag.used_login_name ? (
                  <div className="flex gap-2">
                    <dt>Anmeldename:</dt>
                    <dd className="break-all text-foreground">{auftrag.used_login_name}</dd>
                  </div>
                ) : null}
                {auftrag.used_password ? (
                  <div className="flex gap-2">
                    <dt>Passwort:</dt>
                    <dd className="break-all text-foreground">{auftrag.used_password}</dd>
                  </div>
                ) : null}
                {auftrag.webid_link ? (
                  <div className="flex gap-2">
                    <dt>WebID-Link:</dt>
                    <dd className="break-all text-foreground">{auftrag.webid_link}</dd>
                  </div>
                ) : null}
                {auftrag.postident_link ? (
                  <div className="flex gap-2">
                    <dt>Postident-Link:</dt>
                    <dd className="break-all text-foreground">{auftrag.postident_link}</dd>
                  </div>
                ) : null}
              </dl>
            </div>

            <span
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                auftrag.status === "erfolgreich"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : auftrag.status === "fehlgeschlagen"
                    ? "bg-destructive/10 text-destructive"
                    : "bg-secondary text-muted-foreground"
              }`}
            >
              {auftrag.status === "erfolgreich" ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : auftrag.status === "fehlgeschlagen" ? (
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              ) : null}
              {statusLabel(auftrag.status, true)}
            </span>
          </li>
        ))}
      </ul>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {canFinish ? (
        <div className="mt-6 border-t border-border pt-5">
          <button
            type="button"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            {pending ? "Wird abgeschlossen …" : "Abschluss bestätigen"}
          </button>
        </div>
      ) : null}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Auftrag abschließen</DialogTitle>
            <DialogDescription>
              Danach kannst du nichts mehr ändern. Der Datensatz wird als abgeschlossen markiert.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              className="inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
            >
              Abbrechen
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                setConfirmOpen(false);
                onFinish();
              }}
              className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              Abschließen
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

type CompletePayload = {
  status: "erfolgreich" | "fehlgeschlagen";
  used_login_name?: string | null;
  used_password?: string | null;
  webid_link?: string | null;
  postident_link?: string | null;
};

function StepCard({
  item,
  step,
  editable,
  onSaved,
  saveEmail,
  complete,
}: {
  item: WorkItem;
  step: WorkAuftrag;
  editable: boolean;
  onSaved: (next: WorkItem) => void;
  saveEmail: (email: string) => Promise<WorkItem>;
  complete: (payload: CompletePayload) => Promise<WorkItem>;
}) {
  const config = useMemo(() => fieldsFor(step), [step]);
  const isEmail = isEmailAuftrag(step);

  const [email, setEmail] = useState(item.email_address ?? "");
  const [loginName, setLoginName] = useState(step.used_login_name ?? step.login_name ?? "");
  const [password, setPassword] = useState(step.used_password ?? step.password ?? "");
  const [webid, setWebid] = useState(step.webid_link ?? "");
  const [postident, setPostident] = useState(step.postident_link ?? "");
  const [infoOpen, setInfoOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lightboxImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxImage(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxImage]);


  const emailMutation = useMutation({
    mutationFn: () => saveEmail(email.trim()),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  const completeMutation = useMutation({
    mutationFn: (status: "erfolgreich" | "fehlgeschlagen") =>
      complete({
        status,
        used_login_name: config.credentials ? loginName.trim() : null,
        used_password: config.credentials ? password.trim() : null,
        webid_link: config.webid ? webid.trim() : null,
        postident_link: config.postident ? postident.trim() : null,
      }),
    onSuccess: onSaved,
    onError: (err: Error) => setError(err.message),
  });

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-sm sm:rounded-2xl sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
          <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
            <AuftragLogo
              value={step.logo_path}
              alt={step.name}
              className="h-full w-full object-contain p-1.5"
              fallback={
                <span className="text-xs font-semibold text-muted-foreground">
                  {step.name.slice(0, 2).toUpperCase()}
                </span>
              }
            />
          </span>
          <div className="min-w-0">
            <h2 className="break-words text-lg font-bold tracking-tight text-foreground">{step.name}</h2>
            <p className="text-xs text-muted-foreground">
              {step.ident_type === "email"
                ? "E-Mail"
                : step.ident_type === "videoident"
                  ? "Videoident"
                  : step.ident_type === "postident"
                    ? "Postident"
                    : "Auftrag"}{" "}
              · {statusLabel(step.status, Boolean(item.claimed_by))}
            </p>
          </div>
        </div>

        {step.besonderheiten || step.images.length > 0 ? (
          <button
            type="button"
            onClick={() => setInfoOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary sm:w-auto"
          >
            <Info className="h-4 w-4" aria-hidden="true" />
            INFOS
          </button>
        ) : null}
      </div>

      {isEmail ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-primary/30 bg-primary/8 px-4 py-3 text-sm text-foreground">
            Für das E-Mail-Konto <strong>nicht</strong> die echten Daten des Datensatzes
            verwenden. Nur der Name wird übernommen – Adresse und Geburtsdatum unten sind
            eigens dafür erzeugt.
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Readonly label="Vorname(n)" value={item.first_name} />
            <Readonly label="Nachname" value={item.last_name} />
            <Readonly label="Straße (generiert)" value={item.email_street ?? "…"} />
            <Readonly
              label="PLZ / Ort (generiert)"
              value={
                item.email_postal_code
                  ? `${item.email_postal_code} ${item.email_city ?? ""}`.trim()
                  : "…"
              }
            />
            <Readonly
              label="Geburtsdatum (generiert)"
              value={formatDate(item.email_birth_date)}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="email-address">
              Verwendete E-Mail-Adresse
            </label>
            <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <input
                id="email-address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!editable}
                placeholder="name@anbieter.de"
                className={`${inputClass} sm:max-w-sm`}
              />
              <button
                type="button"
                disabled={!editable || !email.trim() || emailMutation.isPending}
                onClick={() => {
                  setError(null);
                  emailMutation.mutate();
                }}
                className="inline-flex w-full items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60 sm:w-auto"
              >
                {emailMutation.isPending ? "Wird gespeichert …" : "E-Mail speichern"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {item.email_address ? (
            <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
              <span className="text-muted-foreground">Für die Registrierung verwenden: </span>
              <strong className="text-foreground">{item.email_address}</strong>
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground">
              Noch keine E-Mail-Adresse hinterlegt – bitte zuerst den E-Mail-Auftrag erledigen.
            </p>
          )}

          {item.phone_number ? (
            <div className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm">
              <span className="text-muted-foreground">Für die Registrierung verwenden: </span>
              <strong className="text-foreground">{item.phone_number}</strong>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            {step.login_name ? (
              <CopyValue label="Generierter Anmeldename" value={step.login_name} />
            ) : null}
            {step.password ? (
              <CopyValue label="Generiertes Passwort" value={step.password} />
            ) : null}
          </div>

          {config.credentials ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Verwendeter Anmeldename"
                value={loginName}
                onChange={setLoginName}
                disabled={!editable}
              />
              <Field
                label="Verwendetes Passwort"
                value={password}
                onChange={setPassword}
                disabled={!editable}
              />
            </div>
          ) : null}

          {config.webid ? (
            <Field
              label="WebID-Link"
              value={webid}
              onChange={setWebid}
              disabled={!editable}
              placeholder="https://…"
            />
          ) : null}

          {config.postident ? (
            <Field
              label="Postident-Link"
              value={postident}
              onChange={setPostident}
              disabled={!editable}
              placeholder="https://…"
            />
          ) : null}
        </div>
      )}

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:flex-wrap">
        <button
          type="button"
          disabled={!editable || completeMutation.isPending}
          onClick={() => {
            setError(null);
            completeMutation.mutate("erfolgreich");
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
        >
          <Check className="h-4 w-4" aria-hidden="true" />
          Erfolgreich
        </button>
        <button
          type="button"
          disabled={!editable || completeMutation.isPending}
          onClick={() => {
            setError(null);
            completeMutation.mutate("fehlgeschlagen");
          }}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60 sm:w-auto"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Fehlgeschlagen
        </button>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Infos zu {step.name}</DialogTitle>
            <DialogDescription>Besonderheiten und hinterlegte Screenshots.</DialogDescription>
          </DialogHeader>

          {step.besonderheiten ? (
            <p className="whitespace-pre-wrap text-sm text-foreground">{step.besonderheiten}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Keine Besonderheiten hinterlegt.</p>
          )}

          {step.images.length > 0 ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {step.images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setLightboxImage(image)}
                  className="cursor-zoom-in overflow-hidden rounded-xl transition-opacity hover:opacity-90"
                  aria-label={`Screenshot ${step.name} vergrößern`}
                >
                  <AuftragLogo
                    value={image}
                    alt={`Screenshot ${step.name}`}
                    className="w-full rounded-xl border border-border object-contain"
                    fallback={
                      <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                        Bild nicht verfügbar
                      </p>
                    }
                  />
                </button>
              ))}
            </div>
          ) : null}

          {lightboxImage
            ? createPortal(
                <div
                  role="dialog"
                  aria-modal="true"
                  aria-label="Vergrößerter Screenshot"
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/90 p-3 sm:p-4"
                  onClick={() => setLightboxImage(null)}
                >
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setLightboxImage(null);
                    }}
                    className="flex max-h-full cursor-zoom-out items-center justify-center"
                    aria-label="Vergrößerten Screenshot schließen"
                  >
                    <AuftragLogo
                      value={lightboxImage}
                      alt={`Screenshot ${step.name} vergrößert`}
                      className="max-h-[92vh] w-auto max-w-[92vw] rounded-xl object-contain"
                      fallback={
                        <p className="rounded-xl bg-background px-6 py-10 text-center text-sm text-muted-foreground">
                          Bild nicht verfügbar
                        </p>
                      }
                    />
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setLightboxImage(null);
                    }}
                    className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-background/10 text-background transition-colors hover:bg-background/20 sm:right-4 sm:top-4"
                    aria-label="Vergrößerte Ansicht schließen"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>,
                document.body,
              )
            : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function Readonly({
  label,
  value,
  copyable = true,
}: {
  label: string;
  value: string;
  copyable?: boolean;
}) {
  const [copied, copy] = useCopy();
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex items-center gap-1 rounded-xl border border-border bg-background px-3.5 py-2.5">
        {copyable ? (
          <button
            type="button"
            aria-label={`${label} kopieren`}
            title="Klicken zum Kopieren"
            onClick={() => copy(value)}
            className="group/copy flex min-w-0 cursor-copy flex-1 items-center gap-1 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0 flex-1 break-all text-sm font-medium text-foreground">
              {value}
            </span>
            {copied ? (
              <Check className="h-3 w-3 shrink-0 text-emerald-600" aria-hidden="true" />
            ) : null}
          </button>
        ) : (
          <span className="min-w-0 flex-1 break-all text-sm font-medium text-foreground">
            {value}
          </span>
        )}
        {copyable ? <CopyButton value={value} label={label} /> : null}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        type="text"
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
      />
    </div>
  );
}

