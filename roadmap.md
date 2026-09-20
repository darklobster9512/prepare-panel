# Roadmap

- [x] IdentPanel mit dem funktionierenden s24-panel-Startaufbau abgleichen
- [x] Supabase exakt auf die Node-20-kompatible Referenzversion setzen
- [x] Sonderstarter und WebSocket-Attrappe entfernen
- [x] Exakten VPS-Ablauf unter Node.js 20 prüfen

## VPS-Bilder-Fix (2026-09-19)
- [x] SUPABASE_SERVICE_ROLE_KEY, ANOSIM_API_KEY, TELEGRAM_BOT_TOKEN in .env ergänzt (Vite liest sie beim Start automatisch)
- [x] GoLogin-Logo als lokale Datei eingebettet (CDN-Zeiger entfernt)
- [x] Bildsignierung direkt über Supabase im angemeldeten Browser statt über den VPS
- [x] GoLogin-Logo als feste öffentliche Datei ausliefern

## Export im Vic-Detail-Popup (2026-09-20)
- [x] Export-Button pro abgeschlossenem Auftrag im Detail-Popup unter /admin/vics
- [x] Export-Popup mit editierbarem, vorausgefülltem Text (Identität, Notizen-Zeile, Web.de-Mail + generiertes Passwort, Auftragsname, Nummer, WebID-Link, AnoSIM-Share-Link)
- [x] Spalte `share_link` an `anosim_numbers`; Share-Link einmalig über AnoSIM-API erzeugt und gespeichert, danach wiederverwendet

## Interne Kennzeichnung im Vic-Detail-Popup (2026-09-20)
- Neue Spalte `vic_auftraege.internal_mark` (gestartet/erledigt/abgesprungen, NULL = keine).
- Buttons je Auftrags-Card in /admin/vics; Outline lila / Rainbow / Schwarz-Weiß-Streifen.
- Nur Adminbereich, unabhängig vom Auftragsstatus.
