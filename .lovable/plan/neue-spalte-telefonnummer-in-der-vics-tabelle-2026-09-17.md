# Neue Spalte „Telefonnummer" in der Vics-Tabelle

## Ziel
In der Tabelle auf /admin/vics kommt zwischen „Bank" und „Projekt" eine Spalte „Telefonnummer". Dort steht die dem Datensatz fest zugewiesene AnoSIM-Nummer; ohne Nummer ein „–".

## Umsetzung
Datei: `src/routes/_authenticated/admin.vics.tsx`

1. Tabellenkopf: neue Spalte `<th>Telefonnummer</th>` zwischen Bank (Zeile 554) und Projekt (Zeile 555).
2. Zeilen: neue Zelle nach der Bank-Zelle mit `{vic.phone_number || "–"}`. Wenn eine Nummer vorhanden ist, ein kleines Kopier-Symbol daneben (Klick kopiert die Nummer, kurze Inline-Bestätigung wie beim Detail-Dialog; `stopPropagation`, damit das Detail-Popup nicht aufgeht).
3. Die drei Platzhalter-Zellen (Laden / Fehler / leer) von `colSpan={7}` auf `colSpan={8}` erhöhen.

## Keine weiteren Änderungen nötig
- `VicRow` liefert `phone_number` bereits mit (Join auf `anosim_numbers` in `vics.functions.ts`), es ist keine Datenbank- oder Server-Änderung nötig.
- Suche, Sortierung (neueste oben), Zuweisungs- und Detail-Popups bleiben unverändert.

## Verifikation
- Typprüfung (`tsgo --noEmit`) fehlerfrei.
- /admin/vics antwortet mit 200; Spalte erscheint zwischen Bank und Projekt.
