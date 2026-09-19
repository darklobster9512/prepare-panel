# Node-20-/Supabase-Verbindung zuverlässig reparieren

## Ziel
Der bestehende Installations- und PM2-Befehl bleibt exakt unverändert. Unter Node.js 20 starten Anmeldung, Datenbankzugriffe und alle Panels ohne WebSocket-Fehler.

## Umsetzung
1. **WebSocket-Fehler an der tatsächlichen Ursache beheben**
   - Die globale WebSocket-Attrappe entfernen.
   - Supabase bei jedem der drei vorhandenen Clients ausdrücklich einen passenden Realtime-Transport übergeben.
   - Im Browser den nativen WebSocket verwenden; bei serverseitiger Ausführung einen sicheren, nicht geöffneten Transport verwenden, weil die App dort keine Realtime-Kanäle nutzt.
   - Dadurch kann Supabase unter Node 20 normal für Auth, Datenbank und Storage initialisiert werden, ohne beim Client-Aufbau einen Node-22-WebSocket zu verlangen.

2. **Alle Supabase-Zugriffswege abdecken**
   - Gemeinsamen Browser-/SSR-Client korrigieren.
   - Authentifizierten Server-Client korrigieren.
   - Administrativen Server-Client korrigieren.
   - Sicherstellen, dass kein weiterer `createClient`-Aufruf die Standard-WebSocket-Erkennung verwendet.

3. **Bestehenden VPS-Start unverändert erhalten**
   - Die eingecheckte `.env` weiterhin automatisch durch den vorhandenen Starthelfer laden.
   - `npm install`, `npm run build` und `pm2 start "npm run dev -- --host 0.0.0.0 --port {{PORT}}"` unverändert unterstützen.
   - Keine manuell zu setzenden Supabase-Basisvariablen und kein Wechsel auf Node 22.

4. **Unter Node.js 20 vollständig prüfen**
   - Produktionsbuild mit Node 20 erzeugen.
   - Den gebauten Server mit dem gleichen `npm run dev -- --host ... --port ...`-Ablauf starten.
   - Startseite und Anmeldung aufrufen sowie einen echten Supabase-Auth-/Datenbankzugriff prüfen.
   - Serverausgabe auf WebSocket-, Supabase-Umgebungs- und Laufzeitfehler kontrollieren.

## Technische Details
- Die installierte Supabase-Version ruft beim Konstruktor des `RealtimeClient` sofort `WebSocketFactory.getWebSocketConstructor()` auf, sofern keine `realtime.transport`-Option gesetzt ist.
- Node 20 stellt keinen globalen nativen `WebSocket` bereit; normale REST-, Auth- und Storage-Aufrufe benötigen ihn dennoch nicht.
- Die explizite Transportoption behebt daher die Initialisierung direkt an jedem Supabase-Client und ist unabhängig von der Importreihenfolge des Server-Bundles.
