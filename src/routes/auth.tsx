import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, ShieldCheck, UserCheck } from "lucide-react";
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

const signUpSchema = signInSchema;

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

const inputClass =
  "w-full rounded-xl border border-border bg-card px-4 py-3 text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary focus:ring-1 focus:ring-primary";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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

    const parsed = signUpSchema.safeParse({ email, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Eingaben prüfen.");
      return;
    }
    setSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { emailRedirectTo: window.location.origin },
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

  const switchMode = () => {
    setMode(isSignUp ? "signin" : "signup");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Kopfzeile */}
      <header className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <span className="text-lg font-extrabold tracking-tight text-foreground">Panel</span>
          <p className="text-sm text-muted-foreground">
            {isSignUp ? "Sie haben schon ein Konto?" : "Noch kein Konto?"}{" "}
            <button
              type="button"
              onClick={switchMode}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              {isSignUp ? "Anmelden" : "Registrieren"}
            </button>
          </p>
        </div>
      </header>

      {/* Inhalt */}
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <div className="w-full max-w-[30rem]">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Schritt 1 von 1 · Kontodaten
          </p>
          <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-[2.5rem]">
            {isSignUp ? "Konto erstellen" : "Willkommen zurück"}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {isSignUp
              ? "In wenigen Schritten zum Zugang für die interne Prozessvorbereitung."
              : "Melden Sie sich an, um Ihre Unternehmensprozesse zu verwalten."}
          </p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-5" noValidate>
            <Field
              id="email"
              label="E-Mail-Adresse"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <div>
              <label htmlFor="password" className="text-sm font-semibold text-foreground">
                Passwort
              </label>
              <div className="relative mt-2">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Passwort verbergen" : "Passwort anzeigen"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  )}
                </button>
              </div>
              {isSignUp && (
                <p className="mt-2 text-xs text-muted-foreground">Mindestens 6 Zeichen.</p>
              )}
            </div>

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 text-sm leading-relaxed text-destructive"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {isSignUp ? "Konto erstellen" : "Anmelden"}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? "Sie haben schon ein Konto?" : "Noch kein Konto?"}{" "}
              <button
                type="button"
                onClick={switchMode}
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                {isSignUp ? "Anmelden" : "Jetzt registrieren"}
              </button>
            </p>
          </form>

          {/* Vertrauenshinweise */}
          <div className="mt-12 grid gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:grid-cols-3">
            <Trust icon={Lock} text="Verschlüsselte Übertragung" />
            <Trust icon={ShieldCheck} text="Nur interner Zugang" />
            <Trust icon={UserCheck} text="Rolle wird automatisch vergeben" />
          </div>
        </div>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto w-full max-w-5xl px-6 py-6 text-sm text-muted-foreground">
          © {new Date().getFullYear()} Panel · Interne Vorbereitung von Unternehmensprozessen
        </div>
      </footer>
    </div>
  );
}

function Trust({
  icon: Icon,
  text,
}: {
  icon: typeof Lock;
  text: string;
}) {
  return (
    <p className="flex items-start gap-2 leading-relaxed">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      {text}
    </p>
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
        className={`${inputClass} mt-2`}
      />
    </div>
  );
}
