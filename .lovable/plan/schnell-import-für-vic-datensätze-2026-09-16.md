# Schnell-Import für Vic-Datensätze

Im Popup zum Anlegen eines Vics kommt oben ein Bereich "Schnell-Import". Ein Klick öffnet ein großes Textfeld, in das du beliebig viele Datensätze als Text einfügst. Die Datensätze werden automatisch erkannt, in einer Vorschau angezeigt und nach deiner Bestätigung alle auf einmal gespeichert.

## Ablauf

1. Button "Schnell-Import" im Popup öffnet das große Textfeld.
2. Text einfügen, Klick auf "Datensätze erkennen".
3. Vorschau: eine Karte je erkanntem Datensatz mit allen Feldern. Felder sind direkt korrigierbar, einzelne Datensätze abwählbar/entfernbar.
4. Klick auf "Alle speichern" legt die ausgewählten Datensätze an. Danach schließt das Popup und die Tabelle aktualisiert sich.

## Erkennung

Datensätze werden an Leerzeilen-Blöcken und an Trennzeilen wie `=== Name ===` getrennt. Ein neuer Datensatz beginnt außerdem, sobald ein bereits gefülltes Feld erneut auftaucht (z. B. ein zweites "Vorname:").

Erkannt werden beide Schreibweisen:

- Mit Beschriftung: `Vorname:`, `Nachname:`, `Geburtsname:`, `Geburtsdatum:`, `Geburtsort:`, `Familienstand:`, `Steuer-ID:`, `Aktuelle Bank:` / `Bank:`, `Straße:`, `PLZ:`, `Ort:`
- Ohne Beschriftung:
  - Namenszeile: `Stefan Christian Ehses` → Vorname(n) "Stefan Christian", Nachname "Ehses" (Namenszusätze wie van, von, de, der werden zum Nachnamen gezogen)
  - `24.07.1966 in Trier` → Geburtsdatum + Geburtsort
  - Straßenzeile: `Hordenbachstr. 10`
  - PLZ/Ort-Zeile: `42369 Wuppertal`
  - Zeilen wie `12:30 Uhr (LIMEX)` landen in den Notizen

Datum wird von `TT.MM.JJJJ` ins Datenbankformat umgewandelt. Nicht zuordenbare Zeilen kommen ins Notizfeld, damit nichts verloren geht. Datensätze ohne Vor- und Nachname werden in der Vorschau als unvollständig markiert und nicht gespeichert.

## Neues Feld "Geburtsname"

Zusätzliche Spalte `birth_name` für Vics, im Formular unter "Nachname" und als Spalte in der Tabellenansicht. Optional wie die übrigen Felder.

## Technische Details

- Migration: `ALTER TABLE public.vics ADD COLUMN birth_name text;` (keine Policy-Änderung nötig)
- `src/lib/vics.functions.ts`: `birth_name` in Schema, Typ und Select-Spalten; neue Server-Funktion `createVicsBulk` (Array von Vic-Objekten, Admin-Prüfung, ein Insert) — maximal 200 Datensätze pro Aufruf
- `src/lib/vic-parser.ts`: reine Parser-Funktion `parseVics(text): ParsedVic[]`, clientseitig genutzt, ohne Abhängigkeiten
- `src/routes/_authenticated/admin.vics.tsx`: Schnell-Import-Ansicht im bestehenden Dialog (Zustand: `mode: "form" | "import" | "preview"`), Vorschaukarten mit editierbaren Feldern, `useMutation` auf `createVicsBulk` + `invalidateQueries`, deutsche Meldungen inline; neue Spalte "Geburtsname" in Formular und Tabelle
