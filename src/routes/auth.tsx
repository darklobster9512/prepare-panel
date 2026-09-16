import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import { fetchRole, panelPathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Anmelden & Registrieren – Internes Panel" },
      {
        name: "description",
        content:
          "Melden Sie sich im internen Panel an oder registrieren Sie ein neues Mitarbeiterkonto.",
      },
      { property: "og:title", content: "Anmelden & Registrieren – Internes Panel" },
      {
        property: "og:description",
        content:
          "Melden Sie sich im internen Panel an oder registrieren Sie ein neues Mitarbeiterkonto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

const signInSchema = z.object({
  email: z.string().trim().email({ message: "Bitte eine gültige E-Mail-Adresse eingeben." }),
  password: z.string().min(6, { message: "Das Passwort muss mindestens 6 Zeichen haben." }),
});

const signUpSchema = signInSchema.extend({
  firstName: z.string().trim().min(2, { message: "Bitte Vornamen eingeben." }).max(60),
  lastName: z.string().trim().min(2, { message: "Bitte Nachnamen eingeben." }).max(60),
});

function translateError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-Mail oder Passwort ist falsch.";
  if (m.includes("already registered") || m.includes("already been registered"))
    return "Für diese E-Mail-Adresse besteht bereits ein Konto.";
  if (m.includes("email not confirmed"))
    return "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse.";
  if (m.includes("password")) return "Das Passwort erfüllt die Anforderungen nicht.";
  return "Es ist ein Fehler aufgetreten. Bitte versuchen Sie es erneut.";
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const goToPanel = async (userId: string) => {
    const role = await fetchRole(userId);
    navigate({ to: panelPathForRole(role), replace: true });
  };

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session?.user) void goToPanel(data.session.user.id);
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (mode === "signin") {
      const parsed = signInSchema.safeParse({ email, password });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Eingaben prüfen.");
        return;
      }
      setSubmitting(true);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      setSubmitting(false);
      if (signInError || !data.user) {
        setError(translateError(signInError?.message ?? ""));
        return;
      }
      await goToPanel(data.user.id);
      return;
    }

    const parsed = signUpSchema.safeParse({ email, password, firstName, lastName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Eingaben prüfen.");
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
      },
    });
    setSubmitting(false);

    if (signUpError) {
      setError(translateError(signUpError.message));
      return;
    }
    if (!data.session || !data.user) {
      setError(
        "Konto erstellt. Bitte bestätigen Sie zuerst den Link in Ihrer E-Mail und melden Sie sich anschliessend an.",
      );
      setMode("signin");
      return;
    }
    await goToPanel(data.user.id);
  };

  const isSignUp = mode === "signup";

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1fr_minmax(0,38rem)]">
      {/* Formularseite */}
      <div className="flex flex-col px-6 py-10 sm:px-12 lg:px-16">
        <span className="text-lg font-extrabold tracking-tight text-foreground">Panel</span>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl">
            {isSignUp ? "Konto erstellen" : "Willkommen zurück"}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {isSignUp
              ? "In wenigen Schritten zum Zugang für die interne Prozessvorbereitung."
              : "Melden Sie sich an, um Ihre Unternehmensprozesse zu verwalten."}
          </p>

          <div className="mt-8 inline-flex rounded-full bg-secondary p-1">
            {(["signin", "signup"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                  mode === value
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {value === "signin" ? "Anmelden" : "Registrieren"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
            {isSignUp && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  id="firstName"
                  label="Vorname"
                  value={firstName}
                  onChange={setFirstName}
                  autoComplete="given-name"
                />
                <Field
                  id="lastName"
                  label="Nachname"
                  value={lastName}
                  onChange={setLastName}
                  autoComplete="family-name"
                />
              </div>
            )}

            <Field
              id="email"
              label="E-Mail-Adresse"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <div>
              <label
                htmlFor="password"
                className="text-sm font-semibold text-foreground"
              >
                Passwort
              </label>
              <div className="relative mt-1.5">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className="w-full rounded-xl border border-input bg-card px-4 py-3 pr-12 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
                  placeholder={isSignUp ? "Mindestens 6 Zeichen" : "••••••••"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4.5 w-4.5" aria-hidden="true" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-xl border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSignUp ? "Konto erstellen" : "Anmelden"}
            </button>

            <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
              Neue Konten erhalten automatisch die Rolle „Mitarbeiter". Administratoren
              werden intern freigeschaltet.
            </p>
          </form>
        </div>
      </div>

      {/* Markenseite */}
      <aside className="relative hidden overflow-hidden bg-foreground px-14 py-16 lg:flex lg:flex-col lg:justify-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-32 h-[34rem] w-[34rem] rounded-full bg-primary/30 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -left-24 h-[28rem] w-[28rem] rounded-full bg-primary-glow/20 blur-3xl"
        />

        <div className="relative z-10 max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full border border-background/20 px-4 py-1.5 text-sm font-medium text-background/80">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            Geschützter Bereich
          </span>
          <h2 className="mt-8 text-3xl font-bold leading-tight text-background">
            Alle internen Prozesse an einem Ort vorbereitet
          </h2>
          <ul className="mt-8 space-y-4 text-base leading-relaxed text-background/70">
            <li>Strukturierte Abläufe für Teams und Administration</li>
            <li>Getrennte Ansichten für Admins und Mitarbeitende</li>
            <li>Klarer Überblick über Aufgaben, Status und Freigaben</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-input bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
