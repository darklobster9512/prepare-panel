# Screenshots im INFOS-Fenster per Klick vergrößern

## Ziel
Im Mitarbeiter-Wizard (INFOS-Dialog bei jedem Auftragsschritt) öffnet sich beim Klick auf einen Screenshot ein Vollbild-Blick mit dem Bild in groß. Schließen per Klick auf das Bild, Klick daneben oder ESC.

## Umsetzung

Betroffene Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` (StepCard, INFOS-Dialog ca. Zeile 687–718)

1. Neuer State `lightboxImage: string | null` in StepCard (Pfad des angeklickten Bildes).
2. Screenshot-Bilder im INFOS-Dialog bekommen einen Klick-Handler: Klick setzt `lightboxImage` auf den Bildpfad; Cursor-Pointer und dezenter Hover-Effekt.
3. Neuer verschachtelter Dialog (Lightbox) innerhalb der StepCard:
   - Ohne sichtbaren Rahmen/Panel-Inhalt, Bild zentriert mit `max-h-[90vh] max-w-[90vw]`, `object-contain`.
   - Bild wird über die bestehende `AuftragLogo`-Komponente geladen (gleiche signierte URL wie im INFOS-Dialog, inkl. Fallback „Bild nicht verfügbar").
   - Klick auf das Bild oder daneben schließt die Lightbox (State zurück auf `null`).
4. Keine Änderungen an Datenbank, Server-Funktionen oder Rechten – die Bild-Links werden bereits serverseitig erzeugt und funktionieren unverändert.

## Prüfungen
- Typprüfung (`bunx tsgo --noEmit`) fehlerfrei.
- Seite `/mitarbeiter/auftraege/:vicId` antwortet mit 200.
