import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  Copy,
  FolderKanban,
  IdCard,
  LayoutDashboard,
  Phone,
  Plus,
  RefreshCw,
  Send,
  Users,
  Wallet,
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
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/use-auth";
import {
  buyAnosimNumber,
  getAnosimBalance,
  getAnosimFullServiceProduct,
  listAnosimNumbers,
  listAnosimSms,
  setAnosimNote,
  type AnosimNumberRow,
} from "@/lib/anosim.functions";

export const Route = createFileRoute("/_authenticated/admin/telefonnummern")({
  head: () => ({
    meta: [
      { title: "Telefonnummern – Admin-Panel | IdentPanel" },
      {
        name: "description",
        content: "Nummern kaufen, Laufzeiten im Blick behalten und Guthaben prüfen.",
      },
      { property: "og:title", content: "Telefonnummern – Admin-Panel | IdentPanel" },
      {
        property: "og:description",
        content: "Nummern kaufen, Laufzeiten im Blick behalten und Guthaben prüfen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTelefonnummern,
});

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
  { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
  { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
  { label: "Telegram", icon: Send, to: "/admin/telegram" },
];

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" });
}

function remaining(endDate: string) {
  const end = new Date(endDate).getTime();
  if (Number.isNaN(end)) return "–";
  const diff = end - Date.now();
  if (diff <= 0) return "abgelaufen";
  const days = Math.floor(diff / 86_400_000);
  if (days >= 1) return `noch ${days} Tag${days === 1 ? "" : "e"}`;
  const hours = Math.max(1, Math.floor(diff / 3_600_000));
  return `noch ${hours} Std.`;
}

function formatUsd(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? `${parsed.toFixed(2)} USD` : "–";
}

function typeLabel(rentalType: string) {
  if (rentalType === "RentalFull") return "FullService";
  if (rentalType === "RentalService") return "Service-Miete";
  return rentalType;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={label}
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
    >
      <Copy className="h-3 w-3" aria-hidden="true" />
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}

function AdminTelefonnummern() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchBalance = useServerFn(getAnosimBalance);
  const fetchNumbers = useServerFn(listAnosimNumbers);
  const fetchSms = useServerFn(listAnosimSms);
  const fetchProduct = useServerFn(getAnosimFullServiceProduct);
  const buyNumber = useServerFn(buyAnosimNumber);
  const saveNote = useServerFn(setAnosimNote);

  const [search, setSearch] = useState("");
  const [buyOpen, setBuyOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = role === "admin";

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/mitarbeiter", replace: true });
    }
  }, [loading, role, navigate]);

  const balanceQuery = useQuery({
    queryKey: ["admin", "anosim", "balance"],
    queryFn: () => fetchBalance(),
    enabled: isAdmin,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const numbersQuery = useQuery({
    queryKey: ["admin", "anosim", "numbers"],
    queryFn: () => fetchNumbers(),
    enabled: isAdmin,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const productQuery = useQuery({
    queryKey: ["admin", "anosim", "product"],
    queryFn: () => fetchProduct(),
    enabled: isAdmin && buyOpen,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const smsQuery = useQuery({
    queryKey: ["admin", "anosim", "sms", detailId],
    queryFn: () => fetchSms({ data: { orderBookingId: detailId as number } }),
    enabled: isAdmin && detailId !== null,
    refetchOnWindowFocus: false,
    retry: false,
  });

  const numbers = numbersQuery.data ?? [];
  const detailNumber = useMemo(
    () => numbers.find((entry) => entry.orderBookingId === detailId) ?? null,
    [numbers, detailId],
  );

  const buyMutation = useMutation({
    mutationFn: (productId: number) => buyNumber({ data: { productId } }),
    onSuccess: (result: { numbers: string[] }) => {
      setBuyOpen(false);
      setError(null);
      setMessage(
        result.numbers.length > 0
          ? `Nummer gekauft: ${result.numbers.join(", ")}`
          : "Bestellung ausgeführt.",
      );
      void queryClient.invalidateQueries({ queryKey: ["admin", "anosim"] });
    },
    onError: (err: unknown) => {
      setError(
        err instanceof Error ? err.message : "Kauf konnte nicht ausgeführt werden.",
      );
    },
  });

  const noteMutation = useMutation({
    mutationFn: (values: { orderBookingId: number; number: string; note: string }) =>
      saveNote({
        data: {
          orderBookingId: values.orderBookingId,
          number: values.number,
          note: values.note.trim() ? values.note : null,
        },
      }),
    onSuccess: () => {
      setMessage("Notiz gespeichert.");
      void queryClient.invalidateQueries({
        queryKey: ["admin", "anosim", "numbers"],
      });
    },
    onError: () => setError("Notiz konnte nicht gespeichert werden."),
  });

  const openDetail = (entry: AnosimNumberRow) => {
    setDetailId(entry.orderBookingId);
    setNote(entry.note ?? "");
    setMessage(null);
    setError(null);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return numbers;
    return numbers.filter((entry) =>
      [entry.number, entry.country, entry.service, entry.note ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [numbers, search]);

  return (
    <PanelShell
      title="Telefonnummern"
      subtitle="AnoSIM-Nummern verwalten"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={nav}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-sm">
            <Wallet className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Guthaben
              </p>
              <p className="text-lg font-bold text-foreground">
                {balanceQuery.isLoading
                  ? "…"
                  : balanceQuery.isError
                    ? "nicht verfügbar"
                    : formatUsd(balanceQuery.data?.balance)}
              </p>
            </div>
            <button
              type="button"
              aria-label="Guthaben aktualisieren"
              onClick={() => void balanceQuery.refetch()}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Suchen …"
            className="h-10 w-48"
            aria-label="Nummern durchsuchen"
          />
          <Button
            type="button"
            onClick={() => {
              setError(null);
              setMessage(null);
              setBuyOpen(true);
            }}
            className="rounded-full"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Nummer kaufen
          </Button>
        </div>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
          {message}
        </p>
      ) : null}
      {error ? (
        <p
          className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/40 bg-card px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Nummer</th>
                <th className="px-5 py-3 font-semibold">Land</th>
                <th className="px-5 py-3 font-semibold">Typ</th>
                <th className="px-5 py-3 font-semibold">Start</th>
                <th className="px-5 py-3 font-semibold">Ablauf</th>
                <th className="px-5 py-3 font-semibold">Restlaufzeit</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 font-semibold">Preis</th>
              </tr>
            </thead>
            <tbody>
              {numbersQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    Wird geladen …
                  </td>
                </tr>
              ) : numbersQuery.isError ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    {numbersQuery.error instanceof Error
                      ? numbersQuery.error.message
                      : "Nummern konnten nicht geladen werden."}
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={8}>
                    {numbers.length === 0
                      ? "Noch keine Nummern im AnoSIM-Konto."
                      : "Keine Treffer für diese Suche."}
                  </td>
                </tr>
              ) : (
                filtered.map((entry) => (
                  <tr
                    key={entry.orderBookingId}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDetail(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openDetail(entry);
                      }
                    }}
                    className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-secondary/50"
                  >
                    <td className="px-5 py-4 font-medium text-foreground">
                      {entry.number}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{entry.country}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {typeLabel(entry.rentalType)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDateTime(entry.startDate)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatDateTime(entry.endDate)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {remaining(entry.endDate)}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{entry.state}</td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {formatUsd(entry.priceInUSD)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Dialog open={buyOpen} onOpenChange={setBuyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nummer kaufen</DialogTitle>
            <DialogDescription>
              Deutschland · FullService · 30 Tage
            </DialogDescription>
          </DialogHeader>

          {productQuery.isLoading ? (
            <p className="text-sm text-muted-foreground">Preis wird geladen …</p>
          ) : productQuery.isError ? (
            <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {productQuery.error instanceof Error
                ? productQuery.error.message
                : "Produkt konnte nicht geladen werden."}
            </p>
          ) : productQuery.data ? (
            <div className="space-y-4">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Preis</dt>
                  <dd className="font-medium text-foreground">
                    {formatUsd(productQuery.data.price)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Verfügbar</dt>
                  <dd className="font-medium text-foreground">
                    {productQuery.data.availableCount}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Laufzeit</dt>
                  <dd className="font-medium text-foreground">30 Tage</dd>
                </div>
              </dl>

              <Button
                type="button"
                className="w-full rounded-full"
                disabled={
                  buyMutation.isPending || productQuery.data.availableCount === 0
                }
                onClick={() => buyMutation.mutate(productQuery.data!.productId)}
              >
                {buyMutation.isPending
                  ? "Wird gekauft …"
                  : productQuery.data.availableCount === 0
                    ? "Derzeit nicht verfügbar"
                    : "Kostenpflichtig buchen"}
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={detailId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          {detailNumber ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {detailNumber.number}
                  <CopyButton value={detailNumber.number} label="Nummer kopieren" />
                </DialogTitle>
                <DialogDescription>
                  {typeLabel(detailNumber.rentalType)} · {detailNumber.country}
                </DialogDescription>
              </DialogHeader>

              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="font-medium text-foreground">{detailNumber.state}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Dienst</dt>
                  <dd className="font-medium text-foreground">
                    {detailNumber.service || "–"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Start</dt>
                  <dd className="font-medium text-foreground">
                    {formatDateTime(detailNumber.startDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Ablauf</dt>
                  <dd className="font-medium text-foreground">
                    {formatDateTime(detailNumber.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Restlaufzeit</dt>
                  <dd className="font-medium text-foreground">
                    {remaining(detailNumber.endDate)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Preis</dt>
                  <dd className="font-medium text-foreground">
                    {formatUsd(detailNumber.priceInUSD)}
                  </dd>
                </div>
              </dl>

              <div className="space-y-2">
                <Label htmlFor="anosim_note">Notiz</Label>
                <Textarea
                  id="anosim_note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Eigene Notiz zu dieser Nummer …"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
                  disabled={noteMutation.isPending}
                  onClick={() =>
                    noteMutation.mutate({
                      orderBookingId: detailNumber.orderBookingId,
                      number: detailNumber.number,
                      note,
                    })
                  }
                >
                  {noteMutation.isPending ? "Wird gespeichert …" : "Notiz speichern"}
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">Empfangene SMS</h3>
                  <button
                    type="button"
                    onClick={() => void smsQuery.refetch()}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    Aktualisieren
                  </button>
                </div>

                {smsQuery.isLoading ? (
                  <p className="text-sm text-muted-foreground">Wird geladen …</p>
                ) : smsQuery.isError ? (
                  <p className="text-sm text-muted-foreground">
                    SMS konnten nicht geladen werden.
                  </p>
                ) : (smsQuery.data ?? []).length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Noch keine SMS empfangen.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {(smsQuery.data ?? []).map((sms, index) => (
                      <li
                        key={`${sms.messageDate}-${index}`}
                        className="rounded-xl border border-border bg-secondary/30 px-4 py-3 text-sm"
                      >
                        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                          <span>{sms.messageSender}</span>
                          <span>{formatDateTime(sms.messageDate)}</span>
                        </div>
                        <p className="mt-1 text-foreground">{sms.messageText}</p>
                        <div className="mt-2">
                          <CopyButton value={sms.messageText} label="SMS kopieren" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
