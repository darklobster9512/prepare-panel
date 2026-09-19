# Node-20-kompatibler VPS-Start

## Ziel
Das Projekt soll mit dem exakt angegebenen Ablauf unter Node.js 20 starten – ohne Änderung am PM2-Befehl und ohne die Forderung nach Node.js 22.

## Umsetzung
1. **Serverseitigen WebSocket-Schutz ergänzen**
   - Den bewährten Schutz aus dem funktionierenden Referenzprojekt „heizoel-panel“ übernehmen.
   - Er stellt beim Serverstart unter Node 20 einen sicheren Platzhalter bereit, bevor Supabase geladen wird.
   - Browserseitige Supabase-Verbindungen und Realtime bleiben unverändert; der Platzhalter gilt nur für die serverseitige Ausführung, in der Realtime nicht verwendet wird.

2. **Schutz als allererstes laden**
   - Den Schutz am Anfang des Server-Einstiegs importieren, noch vor TanStack Start und allen indirekten Supabase-Imports.
   - Dadurch kann Supabase beim serverseitigen Rendern nicht mehr mit „native WebSocket not found“ abbrechen.

3. **Bestehenden VPS-Start beibehalten**
   - `npm run dev -- --host 0.0.0.0 --port {{PORT}}` startet nach dem Build weiterhin automatisch den Produktionsserver.
   - Die bereits vorhandene und mit dem Projekt versionierte `.env` bleibt vollständig enthalten; sie enthält die benötigten Supabase-Projekt-, URL- und Publishable-Key-Werte für Server und Browser.
   - Der Produktionsstart lädt diese `.env` automatisch. Ein frischer `git clone`, `npm install` und `npm run build` benötigt daher kein manuelles Setzen dieser Variablen.
   - Keine Änderung an deinem Installations- oder PM2-Befehl.

4. **Node-22-Hinweis korrigieren**
   - Dokumentation und Startmeldungen so anpassen, dass Node.js 20 ausdrücklich unterstützt wird und kein irreführendes Upgrade auf Node 22 mehr verlangt wird.

## Prüfung
- Produktions-Build erstellen.
- Mit einem frischen Projekt-Checkout prüfen, dass `.env` enthalten ist und beim Build sowie Serverstart automatisch verwendet wird.
- Den gebauten Server gezielt mit Node.js 20 und deinem unveränderten `npm run dev -- --host ... --port ...` starten.
- Startseite und `/auth` aufrufen.
- Prüfen, dass weder der Supabase-WebSocket-Fehler noch Vite-HMR-Verbindungen auftreten und der Prozess unter PM2-tauglichen Signalen sauber läuft.
