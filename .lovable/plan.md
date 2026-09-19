# IdentPanel auf den funktionierenden s24-panel-Start zurücksetzen

## Bestätigte Ursache
Der direkte Vergleich mit `s24-panel` zeigt zwei entscheidende Abweichungen:

- `s24-panel` läuft mit `@supabase/supabase-js` **2.110.5**. IdentPanel hat **2.116.0**; erst diese installierte Version verlangt bereits beim Erzeugen jedes Supabase-Clients unter Node 20 einen nativen WebSocket.
- `s24-panel` verwendet schlicht `"dev": "vite"`. IdentPanel besitzt inzwischen einen eigenen Produktionsstarter, ein Node-Nitro-Preset und eine globale WebSocket-Attrappe. Diese Sonderkonstruktion wird wieder entfernt.

## Umsetzung
1. **Supabase auf die funktionierende Referenzversion festsetzen**
   - `@supabase/supabase-js` exakt auf `2.110.5` setzen, damit ein frisches `npm install` nicht erneut die fehlerhafte 2.116.x installiert.
   - Abhängigkeitsdatei aktualisieren und kontrollieren, dass auch `@supabase/realtime-js` in Version 2.110.5 installiert wird.

2. **Startaufbau an s24-panel angleichen**
   - `npm run dev` wieder direkt auf `vite` setzen.
   - Den eigenen Starthelfer und die globale WebSocket-Attrappe entfernen.
   - Das zusätzliche Node-Nitro-Preset sowie den umgeleiteten Server-Einstieg aus der Vite-Konfiguration entfernen.
   - Die beiden erlaubten Domains beibehalten.

3. **Supabase-Konfiguration vereinfachen**
   - Die vorhandenen `.env`-Werte beibehalten; Vite liest sie wie bei s24-panel automatisch ein.
   - Die bisherigen Datenbank-, Auth-, Storage- und Admin-Funktionen unverändert lassen.
   - Keine Attrappe und keinen künstlichen Realtime-Transport verwenden.

4. **Exakten VPS-Ablauf unter Node 20 testen**
   - Saubere Installation wie nach einem frischen Clone durchführen.
   - `npm run build` ausführen.
   - Exakt `npm run dev -- --host 0.0.0.0 --port <PORT>` unter Node 20 starten.
   - Anmeldung und einen echten Datenbankzugriff testen.
   - Server- und Browserausgabe auf WebSocket-, Supabase- und React-Fehler prüfen.

## Ergebnis
Der vom Nutzer vorgegebene Ablauf bleibt unverändert und entspricht wieder dem bewährten Aufbau von s24-panel, statt die Node-20-Inkompatibilität mit weiteren Sonderlösungen zu umgehen.
