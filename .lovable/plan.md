# Request-ID vom externen Panel speichern

## Ziel
Schickt das externe Panel eine `request_id` mit, wird sie beim Vic-Datensatz gespeichert.

## Verhalten
- Neues optionales Feld `request_id` pro Datensatz, z. B. `"request_id": "abc-123"`.
- Bei mehreren Datensätzen (`records`) kann jeder seine eigene `request_id` haben. Steht sie nur einmal oben neben `records`, gilt sie für alle Datensätze im Aufruf.
- Neuer Vic: `request_id` wird mitgespeichert.
- Vic schon vorhanden (neue Aufträge werden hinzugefügt): die `request_id` wird auf die neueste übertragene aktualisiert.
- Fehlt die `request_id`, läuft alles wie bisher.
- Die Antwort enthält pro Datensatz zusätzlich `request_id`.

## Technische Details
- Migration: Spalte `request_id text` (nullable) in `vics`, plus Index.
- `src/routes/api/public/vics.ts`: `request_id` lesen (Datensatz vor oberster Ebene, max. 200 Zeichen), bei Insert setzen, bei vorhandenem Vic per Update setzen, in `results` zurückgeben.
- Keine Änderung an der Admin-Ansicht.
