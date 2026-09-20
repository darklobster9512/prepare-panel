# Export-Popup breiter machen

## Ziel
Das Export-Popup im Detail-Dialog unter `/admin/vics` wird in der Breite vergrößert, damit die Textzeilen (E-Mail-Adresse, Links, Adresse) nicht mehr umbrechen und weder im Textfeld noch im Popup eine Scrollbar nötig ist.

## Änderungen

**Datei: `src/routes/_authenticated/admin.vics.tsx`** (Export-Dialog, Zeilen ~1448–1505)

1. `DialogContent` von `sm:max-w-xl` auf `sm:max-w-3xl` verbreitern, damit auch lange Zeilen (WebID-Link, AnoSIM-Share-Link, Adresse) ohne Zeilenumbruch passen.
2. `Textarea` anpassen:
   - `rows` von 22 auf 21 leicht reduzieren und `resize: none`-Verhalten des shadcn-Textareas belassen — das Textfeld passt damit zusammen mit Titel und Buttons ohne vertikales Scrollen auf den Bildschirm.
   - Falls das Popup insgesamt höher als der Viewport wird: `max-h-[90vh] overflow-hidden` statt Scrollbar — das Textfeld selbst bleibt vollständig sichtbar.
3. Keine inhaltlichen Änderungen am Export-Text (`buildExportText`) oder an der Share-Link-Logik.

## Verifikation
- `bunx tsgo --noEmit` (Typprüfung)
- Seite `/admin/vics` im Preview öffnen, Detail-Popup → Export-Button → prüfen, dass das Popup breiter ist und keine Scrollbar erscheint (Playwright-Screenshot).
