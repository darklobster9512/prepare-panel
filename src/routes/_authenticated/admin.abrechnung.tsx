import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  FolderKanban,
  IdCard,
  LayoutDashboard,
  Phone,
  Send,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuftragLogo } from "@/components/auftrag-logo";
import { PanelShell } from "@/components/panel-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import {
  createPayout,
  getAdminAbrechnung,
  type AdminAbrechnungMitarbeiter,
} from "@/lib/abrechnung.functions";

export const Route = createFileRoute("/_authenticated/admin/abrechnung")({
  head: () => ({
    meta: [
      { title: "Abrechnung – Admin | IdentPanel" },
      {
        name: "description",
        content: "Guthaben und Verdienst aller Mitarbeiter im Überblick.",
      },
      { property: "og:title", content: "Abrechnung – Admin | IdentPanel" },
      {
        property: "og:description",
        content: "Guthaben und Verdienst aller Mitarbeiter im Überblick.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminAbrechnungPage,
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

function parseEuroInput(value: string): number | null {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number.parseFloat(normalized) * 100);
}

function AdminAbrechnungPage() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const fetchAbrechnung = useServerFn(getAdminAbrechnung);
  const runPayout = useServerFn(createPayout);
  const [openUserId, setOpenUserId] = useState<string | null>(null);
  const [payoutTarget, setPayoutTarget] = useState<AdminAbrechnungMitarbeiter | null>(null);
  const [payoutAmount, setPayoutAmount] = useState("");

  const abrechnungQuery = useQuery({
    queryKey: ["admin", "abrechnung"],
    queryFn: () => fetchAbrechnung(),
  });

  const payoutMutation = useMutation({
    mutationFn: (input: { user_id: string; amount_cents: number }) => runPayout({ data: input }),
    onSuccess: (_result, input) => {
      toast.success(
        `Auszahlung über ${eur.format(input.amount_cents / 100)} wurde notiert.`,
      );
      setPayoutTarget(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "abrechnung"] });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Auszahlung fehlgeschlagen.");
    },
  });

  const openPayout = (m: AdminAbrechnungMitarbeiter) => {
    setPayoutTarget(m);
    setPayoutAmount(eur.format(m.balance_cents / 100).replace(/\s*€/u, "").trim());
  };

  const confirmPayout = () => {
    if (!payoutTarget) return;
    const cents = parseEuroInput(payoutAmount);
    if (cents === null || cents <= 0) {
      toast.error("Bitte einen gültigen Betrag eingeben.");
      return;
    }
    if (cents > payoutTarget.balance_cents) {
      toast.error("Der Betrag übersteigt das aktuelle Guthaben.");
      return;
    }
    payoutMutation.mutate({ user_id: payoutTarget.user_id, amount_cents: cents });
  };

  const data = abrechnungQuery.data;

  return (
    <PanelShell
      title="Abrechnung"
      subtitle="Guthaben und Verdienst der Mitarbeiter"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={[
        { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
        { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
        { label: "Vics", icon: IdCard, to: "/admin/vics" },
        { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
        { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
        { label: "Telegram", icon: Send, to: "/admin/telegram" },
        { label: "Abrechnung", icon: Wallet, to: "/admin/abrechnung" },
      ]}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border border-border bg-card px-5 py-7 shadow-sm sm:px-10">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Wallet className="h-6 w-6" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Guthaben gesamt
              </p>
              <p className="text-3xl font-bold tracking-tight text-foreground">
                {data ? eur.format(data.total_cents / 100) : "…"}
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

        {abrechnungQuery.isLoading && (
          <p className="text-sm text-muted-foreground">Abrechnung wird geladen …</p>
        )}
        {abrechnungQuery.isError && (
          <p className="text-sm text-destructive">
            Die Abrechnung konnte nicht geladen werden.
          </p>
        )}
        {data && data.mitarbeiter.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Noch keine Mitarbeiter vorhanden.
          </p>
        )}

        {data?.mitarbeiter.map((m) => {
          const open = openUserId === m.user_id;
          return (
            <section
              key={m.user_id}
              className="rounded-xl border border-border bg-card px-5 py-6 shadow-sm sm:px-8"
            >
              <div className="flex w-full items-center gap-4">
                <button
                  type="button"
                  onClick={() => setOpenUserId(open ? null : m.user_id)}
                  className="flex min-w-0 flex-1 items-center gap-4 text-left"
                  aria-expanded={open}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-bold tracking-tight text-foreground">
                      {m.name}
                    </p>
                    {m.email && m.email !== m.name && (
                      <p className="truncate text-xs text-muted-foreground">{m.email}</p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 font-medium text-emerald-600">
                        {m.success_count}× erfolgreich
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 font-medium text-destructive">
                        {m.failed_count}× fehlgeschlagen
                      </span>
                    </div>
                  </div>
                  <p className="shrink-0 text-2xl font-bold tabular-nums tracking-tight text-foreground">
                    {eur.format(m.balance_cents / 100)}
                  </p>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>
                {m.balance_cents > 0 && (
                  <Button
                    type="button"
                    size="sm"
                    className="shrink-0 rounded-full"
                    onClick={() => openPayout(m)}
                  >
                    <Banknote className="h-4 w-4" aria-hidden="true" />
                    Auszahlen
                  </Button>
                )}
              </div>

              {open && (
                <div className="mt-4 border-t border-border pt-4">
                  {m.entries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Noch keine abgerechneten Aufträge vorhanden.
                    </p>
                  ) : (
                    <ul className="divide-y divide-border">
                      {m.entries.map((entry) => (
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
                </div>
              )}
            </section>
          );
        })}
      </div>

      <Dialog
        open={payoutTarget !== null}
        onOpenChange={(next) => {
          if (!next) setPayoutTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Auszahlung an {payoutTarget?.name}</DialogTitle>
            <DialogDescription>
              Aktuelles Guthaben:{" "}
              {payoutTarget ? eur.format(payoutTarget.balance_cents / 100) : "–"}. Der
              Betrag wird als Auszahlung im Verlauf notiert und vom Guthaben abgezogen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="payout-amount">Betrag (in Euro)</Label>
            <Input
              id="payout-amount"
              inputMode="decimal"
              value={payoutAmount}
              onChange={(event) => setPayoutAmount(event.target.value)}
              placeholder="z. B. 125,00"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPayoutTarget(null)}
              disabled={payoutMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              type="button"
              onClick={confirmPayout}
              disabled={payoutMutation.isPending}
            >
              {payoutMutation.isPending ? "Wird notiert …" : "Auszahlung bestätigen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
