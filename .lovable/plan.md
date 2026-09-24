# PLZ und Ort getrennt kopierbar

## Ziel

Auf der Auftragsseite des Mitarbeiters (`/mitarbeiter/auftraege/$vicId`) sollen PLZ und Ort überall getrennt voneinander kopierbar sein — beim Vic-Datensatz und bei den generierten Daten im E-Mail-Schritt.

Ist-Zustand (geprüft):

- **Datensatz-Karte (VicCard):** PLZ und Ort sind dort bereits zwei eigene Zeilen mit jeweils eigener Kopier-Funktion (Klick auf den Wert kopiert, Hover zeigt „+"). Hier ist keine Änderung nötig — wird nach dem Bau im Preview geprüft, dass es so sichtbar ist.
- **E-Mail-Schritt:** Hier steht „PLZ / Ort (generiert)" in **einem** Feld — Klick kopiert beides zusammen. Das ist der einzige zusammengefasste Ort und wird geändert.

## Änderung

Nur eine Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` — im E-Mail-Zweig der `StepCard` (Zeilen ~869–881) das kombinierte `Readonly`-Feld „PLZ / Ort (generiert)" ersetzen durch zwei `Readonly`-Felder:

1. **„PLZ (generiert)"** — kopiert nur die Postleitzahl (z. B. `10115`)
2. **„Ort (generiert)"** — kopiert nur den Ort (z. B. `Berlin`)

Beide behalten das gewohnte Klick-zum-Kopieren (Hover „+", grüner Haken). Im 2-Spalten-Raster entstehen damit aus 5 sechs Felder — drei volle Reihen, nichts rutscht einsam umher.

## Verifikation

- Typprüfung/Build fehlerfrei.
- Preview-Check: E-Mail-Schritt zeigt zwei getrennte Felder mit Kopier-Funktion; Datensatz-Karte zeigt PLZ und Ort getrennt kopierbar.

## Nicht geändert

- Straße (generiert), Geburtsdatum (generiert), Anmeldename/Passwort: unverändert.
- Keine Datenbank- oder Server-Änderungen.
- Export im Adminbereich: unverändert.
