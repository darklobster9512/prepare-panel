# Auftrag-Karten quadratisch machen

## Ziel
Die Auftrag-Karten auf /admin/vics (Bereich „Aufträge") sind quadratisch statt rechteckig – inklusive der [+]-Kachel „Auftrag hinzufügen".

## Änderungen (nur Frontend)
Datei `src/components/auftraege-section.tsx`:

1. **Karten**: `min-h-[9.5rem]` durch `aspect-square` ersetzen. Inhalt (Logo oben, Name unten) zentriert ausrichten; Logo vergrößern (z. B. `h-16 w-16`), damit die Fläche gut gefüllt ist. Name bleibt `line-clamp-2`.
2. **[+]-Kachel**: ebenfalls `aspect-square`, zentriert wie bisher.
3. Grid, Hover-Symbole (Stift/Papierkorb), Dialog und alle Funktionen bleiben unverändert.
4. Styling weiterhin nur über Design-Tokens (Raisin-Farben).

## Verifikation
- tsgo-Typcheck fehlerfrei
- /admin/vics lädt (HTTP 200), Karten quadratisch im Preview
