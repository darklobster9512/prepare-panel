# Anmeldung, Registrierung und zwei Panels

## Was entsteht

### 1. Seite `/auth` im Raisin-Registrierungs-Look
- Zweispaltiges Layout: links die Formularkarte, rechts eine ruhige Markenfläche in Marineblau/Blau mit kurzem Nutzenversprechen.
- Oben eine schlanke Kopfzeile mit Wortmarke, Umschalter zwischen „Anmelden" und „Registrieren".
- Registrieren: Vorname, Nachname, E-Mail, Passwort (Mindestlänge, Sichtbarkeits-Umschalter), Hinweistext.
- Anmelden: E-Mail, Passwort.
- Klare Fehlermeldungen in Deutsch (z. B. falsches Passwort, E-Mail bereits vergeben), Ladezustand auf dem Button.
- Nach erfolgreichem Login/Registrierung automatische Weiterleitung: Admins zum Admin-Panel, Mitarbeiter zum Mitarbeiter-Panel.

### 2. Benutzerrollen
- Jeder neu registrierte Account bekommt automatisch die Rolle **Mitarbeiter**.
- **Admin** wird bei Bedarf manuell in der Datenbank vergeben (ich zeige dir danach den passenden Befehl).
- Rollen liegen in einer eigenen, geschützten Tabelle – nicht im Profil – damit sich niemand selbst zum Admin machen kann.

### 3. Admin-Panel (`/admin`) – Mockup
Nur Optik mit Beispieldaten, keine echte Logik:
- Seitenleiste + Kopfzeile mit Name und Abmelden.
- Vier Kennzahlkarten (Mitarbeiter gesamt, offene Prozesse, abgeschlossen, Freigaben).
- Tabelle „Benutzerverwaltung" mit Beispielnutzern, Rolle und Status.
- Liste „Laufende Unternehmensprozesse" mit Fortschrittsbalken.

### 4. Mitarbeiter-Panel (`/mitarbeiter`) – Mockup
- Gleiche Optik, reduzierter Umfang.
- Begrüßung mit Namen, drei Kennzahlkarten (meine Aufgaben, fällig diese Woche, erledigt).
- Aufgabenliste mit Status-Kennzeichnungen und Checkbox-Optik.
- Karte „Dokumente & Vorbereitung" mit Beispieleinträgen.

### 5. Startseite
Der bestehende „Zum Panel"-Button führt künftig auf `/auth`. Angemeldete Nutzer werden direkt in ihr Panel geleitet.

## Technische Umsetzung

- **Sprache/Stack:** Das Referenzprojekt *vic-automation* nutzt React + TypeScript + Tailwind + shadcn/ui – genau wie dieses Projekt. Identisch bleibt also Sprache, UI-Bibliothek und Supabase-Anbindung. Unterschied: dieses Projekt läuft auf TanStack Start (dateibasiertes Routing) statt auf React Router; das Framework lässt sich nicht tauschen, alles andere folgt dem Referenzprojekt.
- **Datenbank-Migration:**
  - `public.profiles` (user_id, first_name, last_name, email) mit RLS: jeder sieht/ändert nur sein eigenes Profil; Admins dürfen alle lesen.
  - Enum `app_role` ('admin','mitarbeiter') und `public.user_roles` (user_id, role) mit RLS; keine Self-Insert-Rechte.
  - `public.has_role(_user_id, _role)` als SECURITY DEFINER Funktion.
  - Trigger `handle_new_user` auf `auth.users`: legt Profil an und vergibt Rolle `mitarbeiter`.
  - GRANTs für `authenticated` und `service_role`, `updated_at`-Trigger.
- **Auth:** `supabase.auth.signUp` / `signInWithPassword` über den vorhandenen Client; `onAuthStateChange` im Root-Layout; Abmelden mit Cache-Leerung und Redirect auf `/auth`.
- **Geschützte Routen:** `/admin` und `/mitarbeiter` unter dem `_authenticated`-Layout (Client-seitiger Gate, Redirect auf `/auth`). Rolle wird per Server-Function geladen; falsche Rolle → Weiterleitung ins eigene Panel.
- **Validierung:** zod-Schemas für beide Formulare.
- **SEO:** eigene `head()`-Metadaten pro Seite; Panels auf `noindex`.

## Was du selbst erledigen musst

Da dies eine eigene Supabase-Instanz ist, muss die E-Mail-Bestätigung dort deaktiviert werden (Dashboard → Authentication → Providers → Email → „Confirm email" aus), damit man sich sofort nach der Registrierung einloggen kann. Ich verlinke dir die Stelle nach der Umsetzung.
