# Vic-Tabelle: Spalten reduzieren

## Ziel
Die Tabelle auf /admin/vics zeigt nur noch diese 7 Spalten (in dieser Reihenfolge):

Name · Geburtsdatum · Geburtsort · Bank · Projekt · Aufträge · Aktionen

Entfallen im Tabellenkopf und in den Zeilen: **Geburtsname, Adresse (Straße/PLZ/Ort), Familienstand, Steuer-ID**.

## Umsetzung (nur `src/routes/_authenticated/admin.vics.tsx`)
- Im `<thead>` die vier `<th>`-Zellen Geburtsname, Adresse, Familienstand, Steuer-ID entfernen.
- Im `<tbody>` die zugehörigen vier `<td>`-Zellen entfernen.
- Die drei `colSpan={11}`-Zellen (Laden, Fehler, leer) auf `colSpan={7}` setzen.
- `min-w-[60rem]` der Tabelle auf einen kleineren Wert (z. B. `min-w-[44rem]`) senken, da weniger Spalten.
- Alles andere bleibt unverändert: Formular-Dialog, Schnell-Import, Vorschau, Suche, Zuweisungs-Dialog und alle Felder in der Datenbank bleiben vollständig erhalten – die Angaben sind weiterhin im Bearbeiten-Popup sichtbar und editierbar.

## Verifikation
- `bunx tsgo --noEmit` fehlerfrei.
- `curl -o /dev/null -w "%{http_code}" http://localhost:8080/admin/vics` → 200.
