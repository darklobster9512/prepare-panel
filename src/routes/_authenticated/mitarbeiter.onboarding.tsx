import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Eye, EyeOff, Globe2, MonitorSmartphone } from "lucide-react";
import { useEffect, useState } from "react";

import gologinLogo from "@/assets/gologin-logo.svg.asset.json";
import { PanelShell } from "@/components/panel-shell";
import { CopyButton } from "@/components/copy-button";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { mitarbeiterNav } from "@/lib/mitarbeiter-nav";
import { getMyOnboarding } from "@/lib/onboarding.functions";

export const Route = createFileRoute("/_authenticated/mitarbeiter/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding – Mitarbeiter-Panel | IdentPanel" },
      {
        name: "description",
        content:
          "Einrichtung des GoLogin-Browsers: App installieren, anmelden und pro Datensatz ein eigenes Profil anlegen.",
      },
      { property: "og:title", content: "Onboarding – Mitarbeiter-Panel | IdentPanel" },
      {
        property: "og:description",
        content:
          "Einrichtung des GoLogin-Browsers: App installieren, anmelden und pro Datensatz ein eigenes Profil anlegen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OnboardingPage,
});

function Step({
  index,
  title,
  children,
}: {
  index: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          {index}
        </span>
        <h3 className="text-base font-bold tracking-tight text-foreground">{title}</h3>
      </div>
      <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

function OnboardingPage() {
  const navigate = useNavigate();
  const { profile, role, loading } = useAuth();
  const fetchOnboarding = useServerFn(getMyOnboarding);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!loading && role === "admin") {
      navigate({ to: "/admin", replace: true });
    }
  }, [loading, role, navigate]);

  const query = useQuery({
    queryKey: ["mitarbeiter", "onboarding"],
    queryFn: () => fetchOnboarding(),
  });

  useEffect(() => {
    if (query.data && !query.data.enabled) {
      navigate({ to: "/mitarbeiter/auftraege", replace: true });
    }
  }, [query.data, navigate]);

  const data = query.data;

  return (
    <PanelShell
      title="Onboarding"
      subtitle="Einrichtung des Arbeitsbrowsers"
      roleLabel="Mitarbeiter"
      userName={profile?.email || "Mitarbeiter"}
      nav={mitarbeiterNav(true)}
    >
      <div className="flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <img
              src={gologinLogo.url}
              alt="GoLogin Logo"
              className="h-8 w-auto"
              loading="lazy"
            />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
              Offizieller Arbeitsbrowser
            </span>
          </div>
          <h2 className="mt-5 text-lg font-bold tracking-tight text-foreground">
            Warum GoLogin?
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            GoLogin ist ein Browser, in dem du für jeden Datensatz eine komplett
            eigene, saubere Browser-Umgebung anlegst. Jedes Profil hat eigene
            Cookies, eigene Kennungen und eine eigene deutsche IP-Adresse. So
            bleiben die Vorgänge sauber getrennt und die Registrierungen laufen
            zuverlässig durch.
          </p>
        </section>

        <Step index={1} title="GoLogin-App herunterladen">
          <p>
            Lade die GoLogin-App für dein Betriebssystem herunter und installiere
            sie.
          </p>
          <Button asChild className="rounded-full">
            <a
              href="https://gologin.com/download/"
              target="_blank"
              rel="noreferrer noopener"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Zum Download
            </a>
          </Button>
        </Step>

        <Step index={2} title="Mit deinen Zugangsdaten anmelden">
          <p>
            Melde dich in der App mit den folgenden Zugangsdaten an. Sie gehören
            nur dir und sind nicht weiterzugeben.
          </p>
          {query.isLoading ? (
            <p>Wird geladen …</p>
          ) : data?.email || data?.password ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  E-Mail
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="cursor-copy font-medium text-foreground">
                    {data?.email || "–"}
                  </span>
                  {data?.email ? (
                    <CopyButton value={data.email} label="GoLogin E-Mail" />
                  ) : null}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Passwort
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="cursor-copy font-medium text-foreground">
                    {data?.password
                      ? showPassword
                        ? data.password
                        : "••••••••"
                      : "–"}
                  </span>
                  {data?.password ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        aria-label={
                          showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                        }
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                      </button>
                      <CopyButton value={data.password} label="GoLogin Passwort" />
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          ) : (
            <p className="rounded-xl border border-border bg-secondary/40 px-4 py-3">
              Zugangsdaten werden noch hinterlegt.
            </p>
          )}
        </Step>

        <Step index={3} title="Pro Datensatz ein eigenes Profil anlegen">
          <p className="flex items-start gap-2">
            <MonitorSmartphone
              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span>
              Lege in GoLogin für jeden Datensatz ein neues Profil an – jeder
              Datensatz bekommt also seinen eigenen Browser. Benenne das Profil
              genauso wie den Datensatz (Vorname und Nachname), damit du es
              jederzeit zuordnen kannst.
            </span>
          </p>
        </Step>

        <Step index={4} title="Deutsche IP zuweisen">
          <p className="flex items-start gap-2">
            <Globe2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              Öffne im Profil den Punkt <strong className="text-foreground">Location</strong>{" "}
              und wähle <strong className="text-foreground">Germany</strong>. Damit
              bekommt das Profil automatisch einen eigenen deutschen Proxy
              (Germany 2, Germany 3 und so weiter). Achte darauf, dass wirklich
              jedes Profil einen eigenen Proxy hat – niemals zwei Profile mit
              derselben IP betreiben.
            </span>
          </p>
        </Step>

        <Step index={5} title="Aufträge abarbeiten und Profil wechseln">
          <p>
            Arbeite im geöffneten Profil alle Aufträge des Datensatzes ab. Sobald
            du fertig bist, schließe den Browser wieder, lege das nächste Profil
            für den nächsten Datensatz an und mach genauso weiter.
          </p>
        </Step>
      </div>
    </PanelShell>
  );
}
