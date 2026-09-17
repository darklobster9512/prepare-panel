# Screenshot-Ansicht mittig zentrieren

## Problem
Beim Klick auf einen Screenshot im INFOS-Fenster öffnet sich die vergrößerte Ansicht in der linken Bildschirmhälfte statt mittig. Ursache: Die Vergrößerung ist als Dialog **innerhalb** des INFOS-Dialogs gerendert. Ein verschiebbares Overlay-Element wird dabei zum Bezugsrahmen der Vergrößerung, sodass die Zentrierung am INFOS-Fenster und nicht am Bildschirm ausgerichtet wird.

## Lösung
Vergrößerte Ansicht aus dem INFOS-Dialog herauslösen und direkt an den Seitenkörper (body) hängen – als eigenes Overlay, das immer den ganzen Bildschirm als Bezugsrahmen hat.

**Datei:** `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`

1. Statt des verschachtelten `<Dialog>` innerhalb des INFOS-Dialogs ein eigenes Overlay-Element über `createPortal(..., document.body)` rendern:
   - Feste Ebene über dem gesamten Bildschirm (`fixed inset-0`), dunkler Hintergrund, Inhalt mit Flexbox `items-center justify-center` exakt mittig.
   - Klick auf das Bild, daneben oder ESC schließt wie bisher.
   - Erscheint nur, wenn `lightboxImage` gesetzt ist; INFOS-Dialog bleibt darunter geöffnet.
2. Dialog-Komponente und Schließen-Verhalten sonst unverändert.

## Ergebnis
Klickt man im INFOS-Fenster auf einen Screenshot, öffnet sich die vergrößerte Ansicht exakt in der Bildschirmmitte; Schließen per Klick oder ESC wie gewohnt.
