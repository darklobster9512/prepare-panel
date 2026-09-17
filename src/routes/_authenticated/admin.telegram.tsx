import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  FolderKanban,
  IdCard,
  LayoutDashboard,
  Phone,
  Plus,
  Send,
  Trash2,
  Users,
} from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import {
  createTelegramRecipient,
  deleteTelegramRecipient,
  listTelegramRecipients,
  sendTelegramTest,
  updateTelegramRecipient,
  type TelegramRecipient,
} from "@/lib/telegram.functions";

export const Route = createFileRoute("/_authenticated/admin/telegram")({
  head: () => ({
    meta: [
      { title: "Telegram – Admin-Panel | IdentPanel" },
      {
        name: "description",
        content:
          "Chat-IDs verwalten, an die Benachrichtigungen über neue Aufträge gesendet werden.",
      },
      { property: "og:title", content: "Telegram – Admin-Panel | IdentPanel" },
      {
        property: "og:description",
        content:
          "Chat-IDs verwalten, an die Benachrichtigungen über neue Aufträge gesendet werden.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminTelegram,
});

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
  { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
  { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
  { label: "Telegram", icon: Send, to: "/admin/telegram" },
];

function AdminTelegram() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, profile, loading } = useAuth();

  const fetchRecipients = useServerFn(listTelegramRecipients);
  const addRecipient = useServerFn(createTelegramRecipient);
  const editRecipient = useServerFn(updateTelegramRecipient);
  const removeRecipient = useServerFn(deleteTelegramRecipient);
  const testRecipient = useServerFn(sendTelegramTest);

  const [open, setOpen] = useState(false);
  const [chatId, setChatId] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && role && role !== "admin") {
      navigate({ to: "/mitarbeiter", replace: true });
    }
  }, [loading, role, navigate]);

  const recipientsQuery = useQuery({
    queryKey: ["admin", "telegram"],
    queryFn: () => fetchRecipients(),
    enabled: role === "admin",
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "telegram"] });

  const saveMutation = useMutation({
    mutationFn: (values: { chat_id: string; label: string | null }) =>
      addRecipient({ data: values }),
    onSuccess: () => {
      setOpen(false);
      setChatId("");
      setLabel("");
      setError(null);
      setMessage("Empfänger gespeichert.");
      invalidate();
    },
    onError: (err: unknown) =>
      setError(
        err instanceof Error && err.message.includes("Chat-ID")
          ? err.message
          : "Empfänger konnte nicht gespeichert werden.",
      ),
  });

  const toggleMutation = useMutation({
    mutationFn: (values: { id: string; active: boolean }) =>
      editRecipient({ data: values }),
    onSuccess: () => invalidate(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeRecipient({ data: { id } }),
    onSuccess: () => {
      setMessage("Empfänger gelöscht.");
      invalidate();
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => testRecipient({ data: { id } }),
    onSuccess: () => {
      setError(null);
      setMessage("Testnachricht gesendet.");
    },
    onError: (err: unknown) => {
      setMessage(null);
      setError(
        err instanceof Error && err.message.startsWith("Telegram")
          ? err.message
          : "Testnachricht konnte nicht gesendet werden.",
      );
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!chatId.trim()) {
      setError("Bitte eine Chat-ID eingeben.");
      return;
    }

    saveMutation.mutate({
      chat_id: chatId.trim(),
      label: label.trim() ? label.trim() : null,
    });
  };

  const handleDelete = (recipient: TelegramRecipient) => {
    if (
      !window.confirm(
        `Empfänger „${recipient.label || recipient.chat_id}" wirklich löschen?`,
      )
    )
      return;
    setMessage(null);
    deleteMutation.mutate(recipient.id);
  };

  const recipients = recipientsQuery.data ?? [];

  return (
    <PanelShell
      title="Telegram"
      subtitle="Benachrichtigungen über neue Aufträge"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={nav}
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            Empfänger
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Sobald du Aufträge zuweist und speicherst, geht an alle aktiven
            Chat-IDs eine Benachrichtigung raus.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full"
          onClick={() => {
            setChatId("");
            setLabel("");
            setError(null);
            setMessage(null);
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Chat-ID hinzufügen
        </Button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground">
          {message}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <section className="mt-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Chat-ID</th>
                <th className="px-5 py-3 font-semibold">Aktiv</th>
                <th className="px-5 py-3 text-right font-semibold">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {recipientsQuery.isLoading ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={4}>
                    Wird geladen …
                  </td>
                </tr>
              ) : recipientsQuery.isError ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={4}>
                    Empfänger konnten nicht geladen werden.
                  </td>
                </tr>
              ) : recipients.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-muted-foreground" colSpan={4}>
                    Noch keine Chat-IDs hinterlegt.
                  </td>
                </tr>
              ) : (
                recipients.map((recipient) => (
                  <tr
                    key={recipient.id}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-5 py-4 font-medium text-foreground">
                      {recipient.label || "–"}
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">
                      {recipient.chat_id}
                    </td>
                    <td className="px-5 py-4">
                      <Switch
                        checked={recipient.active}
                        onCheckedChange={(value) =>
                          toggleMutation.mutate({ id: recipient.id, active: value })
                        }
                        aria-label="Empfänger aktiv"
                      />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          disabled={testMutation.isPending}
                          onClick={() => {
                            setMessage(null);
                            testMutation.mutate(recipient.id);
                          }}
                        >
                          Testnachricht
                        </Button>
                        <button
                          type="button"
                          onClick={() => handleDelete(recipient)}
                          aria-label="Löschen"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
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
            <DialogTitle>Chat-ID hinzufügen</DialogTitle>
            <DialogDescription>
              Die Chat-ID bekommst du z. B. über den Bot @userinfobot. Für Gruppen
              beginnt sie mit einem Minus.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat_id">Chat-ID</Label>
              <Input
                id="chat_id"
                value={chatId}
                onChange={(event) => setChatId(event.target.value)}
                placeholder="-1001234567890"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="label">Name (optional)</Label>
              <Input
                id="label"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Team-Gruppe"
              />
            </div>

            {error ? (
              <p className="flex items-start gap-2 text-sm text-destructive" role="alert">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? "Wird gespeichert …" : "Speichern"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </PanelShell>
  );
}
