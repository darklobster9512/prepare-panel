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

## PLZ und Ort getrennt kopierbar (2026-09-24)
- [x] E-Mail-Schritt: „PLZ / Ort (generiert)" aufgeteilt in „PLZ (generiert)" und „Ort (generiert)", beide einzeln kopierbar
- [x] Typprüfung und Build prüfen

## Guthaben-System für Mitarbeiter (2026-09-27)
- [x] `getMyAbrechnung` in `src/lib/abrechnung.functions.ts`: 5 € erfolgreich / 2,50 € fehlgeschlagen, internal_mark = erfolgreich, admin_only ausgenommen, nachträglich aus Bestandsdaten
- [x] Route `/mitarbeiter/abrechnung` mit Guthaben-Anzeige und Verlauf
- [x] Nav-Eintrag „Abrechnung" in `mitarbeiter-nav.ts`
- [x] Typprüfung und Build prüfen

## Admin-Abrechnung (2026-09-27)
- [x] /admin/abrechnung: Gesamtguthaben + Karte pro Mitarbeiter mit aufklappbarem Verlauf; getAdminAbrechnung (Admin-Check); Nav-Eintrag auf allen Admin-Seiten

## Auszahlungen (2026-09-27)
- [x] payouts-Tabelle + RLS; createPayout (Admin, Guthaben-Check); Guthaben = Verdienst − Auszahlungen; Auszahlen-Button + Dialog auf /admin/abrechnung; Auszahlungs-Einträge in beiden Verläufen; Toaster in __root
