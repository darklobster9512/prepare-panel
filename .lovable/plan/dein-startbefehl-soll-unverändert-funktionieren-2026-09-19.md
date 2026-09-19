# Dein Startbefehl soll unverändert funktionieren

## Ursache

Die Konsole zeigt: Unter `prepare-panel.xyz` läuft der Vite-**Entwicklungsserver**. Daher der Live-Reload-Client, die fehlschlagenden WebSocket-Verbindungen zu `prepare-panel.xyz` und `localhost:8080` und die Supabase-Meldung zum fehlenden WebSocket. Dein Befehl startet mit `npm run dev` genau diesen Entwicklungsmodus.

## Lösung

Das Projekt wird so umgebaut, dass dein Ablauf exakt so bleibt:

```text
npm install
npm run build
pm2 start "npm run dev -- --host 0.0.0.0 --port {{PORT}}" --name {{APP_NAME}}
pm2 save
```

`npm run dev` startet künftig automatisch den fertig gebauten Produktionsserver, wenn ein Build vorhanden ist. Ist keiner vorhanden (Lovable-Vorschau, lokale Arbeit), startet wie bisher der Entwicklungsserver. Deine Zeile funktioniert damit unverändert und liefert auf dem VPS den Produktionsstand ohne Live-Reload.

## Technische Umsetzung

- Neues Startskript `scripts/dev.mjs`:
  - liest `--host` und `--port` aus den übergebenen Argumenten (Fallback: Umgebungsvariablen, sonst Standardwerte),
  - prüft, ob das Build-Ergebnis `.output/server/index.mjs` existiert,
  - falls ja: startet dieses mit `HOST`/`PORT` als Produktionsserver,
  - falls nein: startet `vite dev` mit denselben Argumenten wie bisher.
- `package.json`: `dev` ruft dieses Skript auf; `build`, `build:dev`, `preview`, `lint`, `format` bleiben unverändert. Zusätzlich ein direkter `start`-Befehl für den reinen Produktionsstart.
- `vite.config.ts`: Nitro-Ziel für eigene Builds auf `node-server` festlegen, damit `npm run build` auf dem VPS das Node-Paket `.output/server/index.mjs` erzeugt. Innerhalb von Lovable bleibt das plattformeigene Ziel aktiv. Die Host-Freigabe für `prepare-panel.xyz` bleibt bestehen.
- Kurzer Abschnitt in der Projektdokumentation zum VPS-Betrieb, inklusive Hinweis auf Node.js 22 oder neuer.

## Prüfung

- Produktions-Build lokal erzeugen und über das neue Skript mit Host- und Port-Argument starten; die Seite muss ohne Vite-Client, ohne HMR-Verbindungsversuche und ohne Supabase-WebSocket-Fehler ausgeliefert werden.
- Ohne Build-Ergebnis muss der Entwicklungsmodus weiterhin normal starten, damit die Lovable-Vorschau unverändert läuft.

## Hinweis zum Ausrollen

Der aktuell laufende PM2-Prozess hält weiterhin den alten Entwicklungsserver. Nach dem Aktualisieren des Codes muss er einmal neu gestartet werden (`pm2 restart {{APP_NAME}}`), damit der Produktionsstand greift. Node.js muss auf dem VPS in Version 22 oder neuer laufen.
