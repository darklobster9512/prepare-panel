# AnoSIM-Share-Link direkt beim Nummernkauf erstellen

## Aktueller Stand (geprueft)
- Share-Links werden bisher nicht beim Kauf erstellt, sondern erst bei Bedarf: beim Klick auf "Export" im Admin oder wenn ein Datensatz abgeschlossen und an dein externes Panel zurueckgemeldet wird.
- Die 4 neuesten Nummern (Rudolf Sauter, Friedrich Werner Peter Ripke, Sabine Prenzel, Annette Bringezu) sind alle noch nicht abgeschlossen und wurden nicht exportiert. Deshalb haben sie noch keinen Link. Die API funktioniert, es ist also kein Fehler, sondern der bisherige Ablauf.

## Aenderung
1. Direkt nach jedem erfolgreichen Nummernkauf (Admin-Kauf, Zuweisung einer freien Nummer und automatischer Kauf ueber die Schnittstelle) wird der Share-Link bei AnoSIM erzeugt und gespeichert.
2. Schlaegt das Erzeugen fehl, bleibt die Nummer trotzdem zugewiesen; der Link wird wie bisher beim Export/Abschluss nachgeholt.
3. Einmalig fuer alle aktiven, zugewiesenen Nummern ohne Link (aktuell u. a. die 4 oben) den Link nachtraeglich erzeugen.
4. Der Share-Link wird im Admin-Detailfenster neben der Telefonnummer angezeigt (kopierbar).

## Technische Details
- Gemeinsamer Helfer `ensureShareLink(anosimNumberId)` in `src/lib/anosim-purchase.server.ts` (POST `/OrderBookingShare/{id}`, speichert `weblink` in `anosim_numbers.share_link`); wird von Kaufpfad, Zuweisung und `src/routes/api/public/vics.ts` aufgerufen; `prepare-results.server.ts` und `getVicShareLink` nutzen denselben Helfer.
- Nachtraegliches Erzeugen einmalig per Skript ueber die AnoSIM-API.
- Danach auf dem Server: `git pull`, `npm install`, `npm run build`, `pm2 restart prepare-panel`.
