# PLZ und Ort getrennt kopierbar

## Ziel

Im E-Mail-Schritt des Mitarbeiter-Panels (`/mitarbeiter/auftraege/$vicId`) stehen die generierten Daten bisher als ein Feld „PLZ / Ort (generiert)" — kopiert wird beides zusammen. Künftig gibt es zwei getrennte Felder:

1. **„PLZ (generiert)"** — kopiert nur die Postleitzahl (z. B. `10115`)
2. **„Ort (generiert)"** — kopiert nur den Ort (z. B. `Berlin`)

Beide Felder behalten das gewohnte Klick-zum-Kopieren (Hover „+", grüner Haken). Der Platz im 2-Spalten-Raster bleibt ausgeglichen: aus 5 werden 6 Felder, sodass drei volle Reihen entstehen.

## Änderung

Nur eine Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` — im E-Mail-Zweig der `StepCard` (Zeilen ~869–881) das kombinierte `Readonly`-Feld „PLZ / Ort (generiert)" ersetzen durch zwei `Readonly`-Felder mit `item.email_postal_code` bzw. `item.email_city` (leer → „…" wie bisher).

## Nicht geändert

- Datensatz-Card: PLZ und Ort sind dort bereits einzeln kopierbar.
- Straße (generiert), Geburtsdatum (generiert), Anmeldename/Passwort: unverändert.
- Keine Datenbank- oder Server-Änderungen.
