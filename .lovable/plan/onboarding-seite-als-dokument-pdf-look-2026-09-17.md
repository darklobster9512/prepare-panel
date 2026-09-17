# Onboarding-Seite als Dokument (PDF-Look)

## Ziel

Die Seite `/mitarbeiter/onboarding` sieht nicht mehr wie 5 einzelne Karten aus, sondern wie ein einzelnes Dokument / eine ausgedruckte PDF-Seite.

## Neues Aussehen

- **Ein „Blatt":** zentriertes, schmales Seitenformat (max. ca. 3xl), wie ein A4-Dokument — heller Karton-Hintergrund (`bg-card`), feine Umrandung (`border-border`) und weicher Schatten, damit es sich vom Creme-Hintergrund der Seite abhebt. Außen bleibt der normale Seitenhintergrund sichtbar.
- **Briefkopf oben auf dem Blatt:** GoLogin-Logo links, daneben Titel „Onboarding-Anleitung" mit kleinem Untertitel (z. B. „Arbeitsbrowser einrichten"). Dazwischen ein Trennstrich wie bei einem Brief.
- **Fließtext statt Karten:** Die Erklärung „Warum GoLogin?" wird als normaler Einleitungstext direkt unter dem Briefkopf gesetzt.
- **Nummerierte Abschnitte im Dokumentstil:** Die 5 Schritte (Download, Anmelden, Profil pro Datensatz, deutsche IP, Aufträge abarbeiten) sind keine einzelnen Kästen mehr, sondern fortlaufende Abschnitte mit „Schritt 1", „Schritt 2" … als Überschrift. Nummer in kleiner Kreis-Form, Trennung nur durch dezenten Abstand / feine Linien — wie Kapitel in einer Anleitung.
- **Alles bleibt erhalten:** Download-Button (gologin.com/download/, neuer Tab), Zugangsdaten (E-Mail + Passwort mit Kopier-Symbol, Auge-Symbol, Hinweis „Zugangsdaten werden noch hinterlegt."), Schritte 3–5 mit ihren Hinweisen — nur eben im Dokumentlayout.
- **Fußzeile auf dem Blatt:** kleine Zeile wie „IdentPanel · Onboarding" unten am Dokument, wie eine PDF-Fußzeile.

## Technische Umsetzung

- Nur `src/routes/_authenticated/mitarbeiter.onboarding.tsx` wird umgebaut (Layout/Präsentation).
- `PanelShell`, Datenladen (`getMyOnboarding`), Weiterleitungen, `head()`/noindex und Kopier-/Augen-Funktionen bleiben unverändert.
- Die `Step`-Komponente wird von „Karte" (eigener Rahmen/Hintergrund) auf „Abschnitt" (kein Rahmen, nur Nummer + Überschrift + Text) umgestellt; das ganze Blatt ist ein einziges `<article>` mit Briefkopf, Inhalt und Fußzeile.
- Styling nur über bestehende Design-Tokens (Raisin-Palette), keine Datenbank- oder Server-Änderungen.
