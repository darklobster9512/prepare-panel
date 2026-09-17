# Kopier-Symbole zurück, Klick-auf-Text behalten

## Ziel

Auf der Mitarbeiter-Detailseite (`/mitarbeiter/auftraege/$vicId`) bleiben beide Wege zum Kopieren erhalten:

1. Klick direkt auf den Wert (Hover zeigt „+", nach Klick grüner Haken) – wie zuletzt umgesetzt.
2. Zusätzlich wieder das feste Kopier-Symbol (Copy-Icon) neben den kopierbaren Werten – wie vor der letzten Änderung.

Nicht kopierbar bleiben weiterhin: selbst auszufüllende Felder (Verwendeter Anmeldename, Verwendetes Passwort, WebID-Link, Postident-Link) sowie Familienstand und Steuer-ID.

## Änderungen

Nur eine Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`

Die bestehende Komponente `CopyButton` aus `src/components/copy-button.tsx` (Copy-Icon, 1500 ms Haken-Bestätigung) wird importiert und an allen kopierbaren Stellen neben dem klickbaren Wert angezeigt:

- **`CopyText`** (Vic-Card-Zeilen wie Vorname(n), Nachname, Geburtsdatum, Adresse): Copy-Icon rechts neben dem Text, Text bleibt klickbar (Hover-„+"/Haken bleiben).
- **`CopyValue`** (Erstellte E-Mail, Telefonnummer, Generierter Anmeldename, Generiertes Passwort): Copy-Icon rechts neben dem Wert, Wert bleibt klickbar.
- **`Readonly`** (generierte Adresse, generiertes Geburtsdatum im E-Mail-Schritt): Copy-Icon rechts in der Box, Wert bleibt klickbar.

Beide Elemente (Icon und Text) kopieren unabhängig voneinander – jeweils mit eigener kurzer Haken-Bestätigung.

## Nicht geändert

- `Field`-Eingabefelder ohne Kopier-Funktion
- Familienstand / Steuer-ID ohne Copy-Icon
- Datenbank, Server-Funktionen, Rechte: keine Änderungen
