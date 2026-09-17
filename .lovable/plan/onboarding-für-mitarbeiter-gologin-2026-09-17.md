# Onboarding für Mitarbeiter (GoLogin)

## Admin-Panel: /admin/mitarbeiter

Jede Zeile in der Mitarbeiterliste bekommt eine neue Spalte **Onboarding** und eine Aktion „Onboarding bearbeiten":

- Schalter **Onboarding aktiv** (an/aus).
- Feld **GoLogin E-Mail**.
- Feld **GoLogin Passwort** (mit Auge-Symbol zum Anzeigen).
- Speichern mit deutscher Rückmeldung; die Liste aktualisiert sich selbst.

Ist Onboarding aus, sieht der Mitarbeiter den Reiter nicht.

## Mitarbeiter-Panel: neuer Reiter „Onboarding"

Erscheint in der Seitenleiste nur, wenn Onboarding für dieses Konto aktiviert ist. Seite `/mitarbeiter/onboarding` im bestehenden Raisin-Stil:

1. Kopfbereich mit GoLogin-Logo (aus der hochgeladenen Datei) und kurzer Erklärung: GoLogin ist ein Browser, mit dem für jeden Datensatz eine eigene, saubere Browser-Umgebung entsteht.
2. **Schritt 1 – App herunterladen:** Button zu https://gologin.com/download/ (öffnet in neuem Tab).
3. **Schritt 2 – Anmelden:** seine persönlichen Zugangsdaten (E-Mail und Passwort) werden angezeigt, beide mit Kopier-Symbol. Passwort standardmäßig verdeckt, mit Auge-Symbol sichtbar. Sind noch keine Daten hinterlegt: Hinweis „Zugangsdaten werden noch hinterlegt."
4. **Schritt 3 – Profil pro Datensatz:** Für jeden Datensatz ein eigenes Profil anlegen, benannt wie der Datensatz.
5. **Schritt 4 – Deutsche IP:** Im Profil auf „Location" und dann „Germany" klicken. Hinweis, dass dabei automatisch ein eigener Proxy vergeben wird (Germany 2, Germany 3 …) und jedes Profil einen eigenen bekommen muss.
6. **Schritt 5 – Aufträge erledigen, Browser schließen, nächstes Profil anlegen.**

Nummerierte Schritt-Karten, ruhige Optik wie im restlichen Panel, Seite auf „nicht indexieren".

## Technische Umsetzung

- **Migration:** `public.profiles` erhält `onboarding_enabled boolean not null default false`, `gologin_email text`, `gologin_password text`. Eigene RLS-Policy bleibt (jeder liest sein Profil, Admins alle); Schreiben dieser Felder nur für Admins — die bestehende Self-Update-Policy wird so eingeschränkt, dass Mitarbeiter diese drei Spalten nicht ändern können (über einen `BEFORE UPDATE`-Trigger, der die Werte bei Nicht-Admins auf die alten zurücksetzt).
- **Server:** `src/lib/admin-users.functions.ts` — `listEmployees` liefert zusätzlich die drei Felder; neue Funktion `updateEmployeeOnboarding({ userId, onboardingEnabled, gologinEmail, gologinPassword })` mit `requireSupabaseAuth` + `assertAdmin`, zod-validiert.
- **Server:** neue `src/lib/onboarding.functions.ts` mit `getMyOnboarding` (`requireSupabaseAuth`, liest nur das eigene Profil über `context.supabase`, gibt `{ enabled, email, password }` zurück).
- **Client:** `src/hooks/use-auth.ts` lädt `onboarding_enabled` mit ins Profil, damit die Seitenleiste den Reiter bedingt anzeigt; Nav-Listen in den Mitarbeiter-Routen entsprechend ergänzen.
- **Route:** `src/routes/_authenticated/mitarbeiter.onboarding.tsx` mit eigenem `head()` (Titel „Onboarding – Mitarbeiter-Panel | IdentPanel", noindex); Daten per `useServerFn` + `useQuery`; ist Onboarding aus, Weiterleitung auf `/mitarbeiter/auftraege`.
- **Logo:** die hochgeladene `Gologin-logo-.svg` wird als CDN-Asset abgelegt (`src/assets/gologin-logo.svg.asset.json`) und auf der Onboarding-Seite eingebunden. Das App-Favicon bleibt unverändert.
- **Kopieren:** bestehende `CopyButton`-Komponente wiederverwenden.
