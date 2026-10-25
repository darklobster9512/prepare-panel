import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  FolderKanban,
  IdCard,
  Landmark,
  LayoutDashboard,
  Phone,
  Send,
  Settings,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { PanelShell } from "@/components/panel-shell";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { getSettings, updateSettings } from "@/lib/settings.functions";

export const Route = createFileRoute("/_authenticated/admin/einstellungen")({
  head: () => ({
    meta: [
      { title: "Einstellungen – Admin-Panel | IdentPanel" },
      { name: "description", content: "Ablauf für übertragene Datensätze festlegen." },
      { property: "og:title", content: "Einstellungen – Admin-Panel | IdentPanel" },
      { property: "og:description", content: "Ablauf für übertragene Datensätze festlegen." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminEinstellungen,
});

const nav = [
  { label: "Übersicht", icon: LayoutDashboard, to: "/admin", exact: true },
  { label: "Mitarbeiter", icon: Users, to: "/admin/mitarbeiter" },
  { label: "Vics", icon: IdCard, to: "/admin/vics" },
  { label: "Bankkonten", icon: Landmark, to: "/admin/bankkonten" },
  { label: "Projekte", icon: FolderKanban, to: "/admin/projekte" },
  { label: "Telefonnummern", icon: Phone, to: "/admin/telefonnummern" },
  { label: "Telegram", icon: Send, to: "/admin/telegram" },
  { label: "Abrechnung", icon: Wallet, to: "/admin/abrechnung" },
  { label: "Einstellungen", icon: Settings, to: "/admin/einstellungen" },
];

function AdminEinstellungen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { role, profile, loading } = useAuth();
  const fetchSettings = useServerFn(getSettings);
  const saveSettings = useServerFn(updateSettings);

  useEffect(() => {
    if (!loading && role && role !== "admin") navigate({ to: "/mitarbeiter", replace: true });
  }, [loading, role, navigate]);

  const q = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => fetchSettings(),
    enabled: role === "admin",
  });

  const m = useMutation({
    mutationFn: (v: boolean) => saveSettings({ data: { auto_buy_number: v } }),
    onSuccess: (d) => {
      qc.setQueryData(["admin", "settings"], d);
      toast.success(d.auto_buy_number ? "Automatischer Nummernkauf aktiviert." : "Automatischer Nummernkauf deaktiviert.");
    },
    onError: () => toast.error("Einstellung konnte nicht gespeichert werden."),
  });

  return (
    <PanelShell
      title="Einstellungen"
      subtitle="Ablauf für übertragene Datensätze"
      roleLabel="Administrator"
      userName={profile?.email || "Administrator"}
      nav={nav}
    >
      <section className="max-w-2xl rounded-xl border bg-card p-6">
        <h2 className="text-lg font-semibold">Übertragene Datensätze</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Gilt für Datensätze, die über die Schnittstelle vom externen Panel kommen.
        </p>
        <div className="mt-6 flex items-start justify-between gap-6">
          <div>
            <Label htmlFor="auto-buy" className="text-base">Nummer automatisch kaufen</Label>
            <p className="mt-1 text-sm text-muted-foreground">
              Wenn aktiviert, wird für jeden neuen Datensatz eine AnoSIM-Nummer gekauft und zugewiesen.
              Wenn deaktiviert, weist du die Nummer im Admin selbst zu.
            </p>
          </div>
          <Switch
            id="auto-buy"
            checked={q.data?.auto_buy_number ?? true}
            disabled={!q.data || m.isPending}
            onCheckedChange={(v) => m.mutate(v)}
          />
        </div>
      </section>
    </PanelShell>
  );
}
