import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ClipboardList,
  Copy,
  FileText,
  Info,
  LayoutDashboard,
  MessageSquare,
  Phone,
  RefreshCw,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { AuftragLogo } from "@/components/auftrag-logo";
import { PanelShell } from "@/components/panel-shell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { statusLabel, statusRingClass } from "@/lib/auftrag-status";
import {
  completeAuftrag,
  ensureEmailIdentity,
  getWorkItem,
  listVicSms,
  saveEmailAddress,
} from "@/lib/mitarbeiter.functions";
import type { WorkAuftrag, WorkItem } from "@/lib/mitarbeiter.types";

export const Route = createFileRoute("/_authenticated/mitarbeiter/auftraege/$vicId")({
  head: () => ({
    meta: [
      { title: "Auftrag bearbeiten – Mitarbeiter-Panel" },
      {
        name: "description",
        content: "Datensatz, Telefonnummer, SMS und Zugangsdaten für die Auftragsbearbeitung.",
      },
      { property: "og:title", content: "Auftrag bearbeiten – Mitarbeiter-Panel" },
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

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`${label} kopieren`}
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
      ) : (
        <Copy className="h-3.5 w-3.5" aria-hidden="true" />
      )}
    </button>
  );
}

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="mt-1 inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
      >
        {value}
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}


function WizardPage() {
  const { vicId } = Route.useParams();
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

  const smsQuery = useQuery({
    queryKey: ["mitarbeiter", "sms", vicId],
    queryFn: () => smsFn({ data: { vic_id: vicId } }),
    enabled: Boolean(item?.phone_order_booking_id),
    refetchInterval: 30000,
  });

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
  const firstOpen = steps.findIndex((step) => step.status === "offen");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const current = activeIndex ?? (firstOpen >= 0 ? firstOpen : 0);
  const step = steps[current] ?? null;

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
      nav={[
        { label: "Übersicht", icon: LayoutDashboard, to: "/mitarbeiter", exact: true },
        { label: "Aufträge", icon: ClipboardList, to: "/mitarbeiter/auftraege" },
        { label: "Termine", icon: CalendarDays },
        { label: "Dokumente", icon: FileText },
      ]}
    >
      <Link
        to="/mitarbeiter/auftraege"
        className="inline-flex items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Zurück zur Übersicht
      </Link>

      {itemQuery.isLoading ? (
        <p className="mt-6 text-sm text-muted-foreground">Wird geladen …</p>
      ) : itemQuery.isError || !item ? (
        <p className="mt-6 text-sm text-destructive">
          {(itemQuery.error as Error)?.message ?? "Datensatz konnte nicht geladen werden."}
        </p>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[22rem_1fr]">
          <aside className="space-y-6">
            <VicCard item={item} />
            <PhoneCard item={item} sms={smsQuery.data ?? []} onRefresh={() => smsQuery.refetch()} />
          </aside>

          <div className="space-y-6">
            {!isMine ? (
              <p className="rounded-xl border border-border bg-secondary px-4 py-3 text-sm text-foreground">
                Dieser Datensatz ist dir nicht zugewiesen – du kannst ihn nur ansehen.
              </p>
            ) : null}

            <StepBar
              steps={steps}
              current={current}
              claimed={Boolean(item.claimed_by)}
              onSelect={setActiveIndex}
            />

            {step ? (
              <StepCard
                key={step.id}
                item={item}
                step={step}
                editable={isMine}
                onSaved={(next) => {
                  setItem(next);
                  queryClient.invalidateQueries({ queryKey: ["mitarbeiter", "work-items"] });
                  const nextOpen = next.auftraege.findIndex((a) => a.status === "offen");
                  setActiveIndex(nextOpen >= 0 ? nextOpen : current);
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
          <div key={row.label} className="flex items-center justify-between gap-2">
            <dt className="shrink-0 text-muted-foreground">{row.label}</dt>
            <dd className="flex min-w-0 items-center gap-1">
              <span className="truncate text-right font-medium text-foreground">
                {row.value}
              </span>
              {row.copyable && row.value !== "–" ? (
                <CopyButton value={row.value} label={row.label} />
              ) : null}
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
  onRefresh,
}: {
  item: WorkItem;
  sms: { messageDate: string; messageSender: string; messageText: string }[];
  onRefresh: () => void;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-foreground">
          <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
          Telefonnummer
        </h2>
        <button
          type="button"
          onClick={onRefresh}
          aria-label="SMS aktualisieren"
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
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
              <p className="flex justify-between gap-2 text-[0.7rem] text-muted-foreground">
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
}: {
  steps: WorkAuftrag[];
  current: number;
  claimed: boolean;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
      {steps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          onClick={() => onSelect(index)}
          title={`${step.name} · ${statusLabel(step.status, claimed)}`}
          className={`inline-flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold transition-colors ${
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
    </div>
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
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
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
          <div>
            <h2 className="text-lg font-bold tracking-tight text-foreground">{step.name}</h2>
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
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary"
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
            <div className="mt-1 flex flex-wrap gap-2">
              <input
                id="email-address"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={!editable}
                placeholder="name@anbieter.de"
                className={`${inputClass} max-w-sm`}
              />
              <button
                type="button"
                disabled={!editable || !email.trim() || emailMutation.isPending}
                onClick={() => {
                  setError(null);
                  emailMutation.mutate();
                }}
                className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
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

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5">
        <button
          type="button"
          disabled={!editable || completeMutation.isPending}
          onClick={() => {
            setError(null);
            completeMutation.mutate("erfolgreich");
          }}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
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
          className="inline-flex items-center gap-2 rounded-full border border-destructive/50 px-5 py-2.5 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          Fehlgeschlagen
        </button>
      </div>

      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
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
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
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
                    className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
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
  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div className="mt-1 flex items-center gap-1 rounded-xl border border-border bg-background px-3.5 py-2.5">
        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{value}</p>
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
  copyable = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  copyable?: boolean;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative mt-1">
        <input
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={`${inputClass} ${copyable ? "pr-11" : ""}`}
        />
        {copyable ? (
          <span className="absolute inset-y-0 right-2 flex items-center">
            <CopyButton value={value} label={label} />
          </span>
        ) : null}
      </div>
    </div>
  );
}

