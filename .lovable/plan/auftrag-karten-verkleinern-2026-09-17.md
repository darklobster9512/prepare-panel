# Auftrag-Karten verkleinern

## Ziel
Die Auftrag-Karten auf /admin/vics (Bereich „Aufträge") sind zu groß – um mindestens 50 % verkleinern.

## Änderungen (nur Frontend)
Datei `src/components/auftraege-section.tsx`:

1. **Grid-Spalten verdoppeln**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` → `grid-cols-4 sm:grid-cols-6 lg:grid-cols-10`. Bei gleicher Containerbreite halbiert das die Kartenbreite (und damit Fläche bei `aspect-square` um ca. 75 %, Breite um 50 %+).
2. **Logo anpassen**: `h-16 w-16` → `h-10 w-10`, damit es in die kleineren Karten passt.
3. **Textgröße anpassen**: Name von `text-sm` auf `text-xs` verkleinern, bleibt `line-clamp-2`.
4. **[+]-Kachel**: passt automatisch mit; Plus-Icon und Beschriftung proportional verkleinern (Icon `h-5 w-5`, Text `text-xs`), damit es optisch zu den Karten passt.
5. Grid-Gap beibehalten (oder leicht auf `gap-3` reduzieren, damit die kleineren Karten nicht verloren wirken).

## Verifikation
- tsgo-Typcheck fehlerfrei
- /admin/vics lädt (HTTP 200), Karten deutlich kleiner im Preview
