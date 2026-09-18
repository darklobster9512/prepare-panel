# Neuer Reiter „Informationen“ im Mitarbeiter-Panel

## Ziel
Im Mitarbeiter-Panel einen neuen Reiter **Informationen** (`/mitarbeiter/informationen`) ergänzen. Die Seite sieht aus wie ein Dokument/PDF (gleicher „Blatt“-Stil wie die Onboarding-Seite: zentriertes Blatt mit Briefkopf, nummerierte Abschnitte, Fließtext, Fußzeile) und erklärt die Vorgaben für die Identvorgänge.

## Inhalt der Seite (Deutsch, Fließtext im PDF-Look)

Briefkopf: Titel **„Informationen“**, Untertitel **„Vorgaben für Identvorgänge“**.

1. **Deine Aufgabe** — Du bereitest für uns die Identvorgänge vor. Verwende dafür immer ausschließlich die Daten, die wir dir pro Vorgang zur Verfügung stellen (Datensatz, generierte Daten, E-Mail-Konto, Telefonnummer). Erfinde nichts selbst und nutze niemals echte fremde Daten.

2. **Formularangaben bei den Banken** — Bei den meisten Banken müssen zusätzliche Angaben gemacht werden (z. B. zur Beschäftigung). Dafür gelten feste Regeln:
   - **Beschäftigung:** immer **Angestellter** wählen.
   - **Branche:** beliebig, etwas Zufälliges auswählen.
   - **Bei Personen ab 65 Jahren:** als Beschäftigung immer **Rentner** wählen.
   - **Gehalt / monatliches Einkommen:** immer ein Wert zwischen **2.000 € und 2.500 €**.
   - **Beschäftigt seit:** immer **5 Jahre oder länger** (z. B. 03.2020 oder 06.2018).
   - **Wohnsituation:** immer **Mietwohnung / zur Miete** angeben.
   - **Wie lange wohnst du dort?:** zwischen **3 und 15 Jahren**, je nach Alter der Person — aber niemals kürzer als 3 Jahre.
   - **Falls nach der Miete gefragt wird:** immer ein Wert zwischen **700 € und 900 €**.

3. **Hinweis-Box** — Kurzer Merksatz: „Im Zweifel gelten immer diese Vorgaben. Bei Fragen sprich uns an.“

Fußzeile: `IdentPanel · Informationen`.

## Technische Umsetzung

- Neue Route `src/routes/_authenticated/mitarbeiter.informationen.tsx`
  - `head()`: Titel „Informationen – Mitarbeiter-Panel | IdentPanel“, eigene Beschreibung, `noindex` (wie alle Panel-Seiten).
  - Admin-Umleitung auf `/admin` (gleiche Prüfung wie Onboarding-Seite).
  - Kein Datenzugriff nötig — rein statischer Inhalt, kein Server-Function, keine Query.
- `src/lib/mitarbeiter-nav.ts`: NavItem „Informationen“ (Icon `Info` aus lucide-react) mit `to: "/mitarbeiter/informationen"` ergänzen — für alle Mitarbeiter sichtbar, unabhängig vom Onboarding-Schalter.
- Layout wiederverwendet aus `mitarbeiter.onboarding.tsx`: `PanelShell` + `article`-Blatt (max-w-3xl, bg-card, border-border, rounded-xl, shadow-sm), nummerierte Abschnitte mit Nummer-in-Kreis. Die Regeln zur Beschäftigung/Wohnung als übersichtliche Definitionsliste (Label + Vorgabe), damit die Seite trotz Umfang ruhig wirkt.
- Styling nur über bestehende Design-Tokens (Raisin-Farben, Plus Jakarta Sans), keine neuen Komponenten-Bibliotheken.

Keine Datenbank-, Server- oder Rechte-Änderungen.
