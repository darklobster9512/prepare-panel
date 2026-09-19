# Produktionsbetrieb auf dem VPS korrigieren

## Ursache

Die Konsole zeigt, dass `prepare-panel.xyz` derzeit den **Vite-Entwicklungsserver** ausliefert: Der Browser lädt den Vite-Client und versucht Live-Reload-WebSockets zu `prepare-panel.xyz` beziehungsweise `localhost:8080` aufzubauen. Das ist kein geeigneter Produktionsstart unter PM2. Die zusätzliche Meldung zum fehlenden nativen WebSocket stammt aus dem Supabase-Client bei serverseitiger Ausführung unter einer älteren Node-Version.

## Umsetzung

- Den Produktions-Build ausdrücklich auf Nitros `node-server`-Ziel für den eigenen VPS festlegen.
- Einen eindeutigen Produktionsbefehl ergänzen, der den gebauten Server über `.output/server/index.mjs` startet, statt `vite dev` oder `vite preview` zu verwenden.
- Die bestehende Host-Freigabe für `prepare-panel.xyz` und `www.prepare-panel.xyz` unverändert lassen; keine HMR-/WebSocket-Konfiguration für die Domain hinzufügen.
- Einen kurzen VPS-/PM2-Abschnitt in die Projektdokumentation aufnehmen:
  1. Node.js 22 oder neuer verwenden.
  2. Abhängigkeiten installieren und den Produktions-Build erstellen.
  3. PM2 mit dem Produktionsbefehl starten beziehungsweise neu laden.
  4. Nginx/Proxy weiterhin auf den von der App verwendeten HTTP-Port leiten; für Vite-HMR ist keine WebSocket-Weiterleitung nötig.
- Lokal prüfen, dass der Produktions-Build das Node-Server-Paket erzeugt und der Produktionsstart die Seite ohne Vite-Client, HMR-Verbindungsversuche und Supabase-WebSocket-Fehler ausliefert.

## Deinen bisherigen Startbefehl ersetzen

Der bisherige Befehl `pm2 start "npm run dev ..."` ist die bestätigte Ursache: Er veröffentlicht den Vite-Entwicklungsserver samt Live-Reload-Client. Er wird durch einen echten Produktionsstart ersetzt.

```text
npm install
npm run build
pm2 delete {{APP_NAME}}
PORT={{PORT}} HOST=0.0.0.0 pm2 start .output/server/index.mjs --name {{APP_NAME}}
pm2 save
```

Zusätzlich muss auf dem VPS Node.js 22 oder neuer aktiv sein (`node -v`). Nach dem Ausrollen muss der alte PM2-Prozess einmal gelöscht und als Produktionsprozess neu angelegt werden; ein normales Reload würde dessen bisherigen Entwicklungsbefehl behalten.
