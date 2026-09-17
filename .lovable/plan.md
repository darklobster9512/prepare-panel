# Mitarbeiter-Ansicht: Screenshots, Kopier-Symbole, Namensfelder

## Screenshots und Logos sichtbar machen

Ursache geprüft: Die Bilder liegen in einem privaten Ablageordner, auf den bisher **nur Admins** Leserechte haben. Deshalb bleiben im INFOS-Fenster die Screenshots leer (und Logos zeigen nur Buchstaben-Kürzel).

Lösung: Leserecht auf diesen Ordner für alle angemeldeten Konten (Admin und Mitarbeiter). Hochladen, Ändern und Löschen bleibt ausschließlich Admins vorbehalten.

Zusätzlich bekommen die Screenshots im INFOS-Fenster einen Platzhalter, falls ein Bild fehlt, statt einfach zu verschwinden.

## Kopier-Symbole

Überall ein kleines Kopier-Symbol, das den Wert direkt in die Zwischenablage legt und kurz einen Haken zeigt:

- Telefonnummer (bereits vorhanden, bleibt)
- Generierte Daten im E-Mail-Schritt: Vorname(n), Nachname, Straße, PLZ/Ort, Geburtsdatum
- Erstellte E-Mail-Adresse (bereits vorhanden, bleibt)
- Generierter Anmeldename und generiertes Passwort (bereits vorhanden, bleibt)
- Eingabefelder „Verwendeter Anmeldename", „Verwendetes Passwort", „WebID-Link", „Postident-Link": Symbol rechts im Feld

## Datensatz-Karte

- Kopier-Symbol bei: Geburtsname, Geburtsdatum, Geburtsort, Straße, PLZ, Ort
- Kein Kopier-Symbol bei: Familienstand, Steuer-ID
- **Aktuelle Bank** wird für Mitarbeitende komplett ausgeblendet
- Neu unter der Überschrift (voller Name) und über dem Geburtsnamen: getrennte Zeilen **Vorname(n)** und **Nachname**, beide ebenfalls mit Kopier-Symbol

## Technisch

- Migration: `CREATE POLICY` auf `storage.objects` – `SELECT` für Rolle `authenticated` auf `bucket_id = 'auftrag-logos'`. Bestehende Admin-Policies unverändert.
- `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`:
  - `CopyValue` bleibt die zentrale Komponente; zusätzlich eine kleine `CopyButton`-Variante für Eingabefelder (`Field` bekommt optional `copyable`).
  - `Readonly` bekommt ein Kopier-Symbol (Prop `copyable`, Standard an).
  - `VicCard`: `rows` umbauen – erst Vorname(n)/Nachname, dann Geburtsname, Geburtsdatum, Geburtsort, Straße, PLZ, Ort (mit Kopieren), danach Familienstand und Steuer-ID (ohne Kopieren); `bank` entfällt.
  - Screenshot-Bereich im INFOS-Dialog: `AuftragLogo` mit `fallback` (Hinweistext „Bild nicht verfügbar").
- Keine Änderungen an Server-Funktionen oder der Admin-Ansicht.
