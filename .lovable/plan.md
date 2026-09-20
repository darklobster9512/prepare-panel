# Telefonnummer im Vic-Detail-Popup

## Ziel
Im Detail-Popup eines Datensatzes unter /admin/vics erscheint ein neuer Abschnitt „Telefonnummer" mit der zugewiesenen AnoSIM-Nummer.

## Inhalt des neuen Abschnitts
- **Nummer zugewiesen:** Die Nummer mit Kopier-Symbol (gleiches Verhalten wie in der Tabellen-Spalte), darunter „Gültig bis TT.MM.JJJJ" und Restlaufzeit (z. B. „noch 21 Tage"); bei abgelaufener Nummer der Hinweis „abgelaufen".
- **Keine Nummer:** Hinweis „Diesem Datensatz ist noch keine Telefonnummer zugewiesen."

Der Abschnitt steht zwischen „E-Mail-Konto" und „Notizen".

## Technisch
- Nur `src/routes/_authenticated/admin.vics.tsx` im Detail-Dialog (nach dem E-Mail-Konto-Block, vor dem Notizen-Block).
- Daten sind bereits vorhanden: `detailVic.phone_number` und `detailVic.phone_end_date` liefert `VicRow` aus `vics.functions.ts` (Join auf `anosim_numbers`) – keine Datenbank- oder Server-Änderung.
- Kopieren über das bestehende `CopyButton`-Muster bzw. wie in der Tabellen-Zelle; Formatierung der Restlaufzeit analog zur Telefonnummer-Karte im Zuweisen-Popup.
- Keine Änderungen an Migrationen, Server-Funktionen oder anderen Popups.

## Prüfung
- Typprüfung (`bunx tsgo --noEmit`) fehlerfrei.
- /admin/vics liefert HTTP 200; Detail-Popup zeigt den neuen Abschnitt mit Nummer bzw. Hinweis.
