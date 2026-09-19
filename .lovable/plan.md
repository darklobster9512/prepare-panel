# Fehler auf dem Server: HMR-Einstellung zurücknehmen + Ursache klären

## Was ich festgestellt habe

1. Meine gestrige HMR-Einstellung (`protocol: "wss", host: "prepare-panel.xyz"`) hat es **schlimmer gemacht**: Jetzt versucht sogar die lokale Vorschau, die Live-Reload-Verbindung über die Domain aufzubauen – die schlägt fehl („Unexpected response code: 200"). Diese Einstellung nehme ich zurück.
2. Beide Meldungen – „Node.js detected but native WebSocket not found" und „Cannot read properties of null (reading 'useContext')" – sind typische Fehler, wenn die App im **Entwicklungsmodus** (Dev-Server) hinter einer Domain/einem Proxy betrieben wird:
   - Die erste kommt vom Live-Reload des Dev-Servers, das eine WebSocket-Verbindung braucht, die der Proxy nicht durchlässt.
   - Die zweite (useContext) ist ein bekanntes Problem des Dev-Modus mit doppelt geladenem React, wenn die Verbindung/SSR über einen Proxy läuft.
3. In der normalen Vorschau hier (localhost / Lovable-Vorschau) läuft die Seite fehlerfrei (Status 200, Build OK).

## Änderungen im Projekt

- `vite.config.ts`: Den `hmr`-Block wieder entfernen, nur `allowedHosts` für die Domain behalten (damit die Seite über die Domain überhaupt erreichbar bleibt).
- Danach Vorschau-Server neu starten und prüfen, dass lokal und über die Domain keine neuen Fehler auftreten.

## Wichtig: Der eigentliche Fix liegt beim Betrieb, nicht im Code

Der Dev-Server ist nicht für den dauerhaften Betrieb hinter einer Domain gedacht. Zwei saubere Wege:

1. **Über Lovable veröffentlichen** (empfohlen): Auf „Publish" klicken und die Domain `prepare-panel.xyz` mit der veröffentlichten Seite verbinden. Der gebaute Stand enthält **kein** Live-Reload – beide Fehler können dort gar nicht auftreten.
2. **Selbst hosten**: Dann bitte nicht den Dev-Server, sondern den Produktions-Build betreiben (`bun run build` und den Build starten). Falls doch der Dev-Server genutzt wird: Node.js 22 oder neuer installieren – das behebt zumindest die „native WebSocket not found"-Meldung.

## Technisch

- Nur `vite.config.ts` (hmr-Block entfernen) + Neustart des Vorschau-Servers.
- Keine Datenbank-, Server-Funktions- oder Rechte-Änderungen.

## Offene Frage an dich (nach Umsetzung)

Wo genau läuft der „deployed Server" – ist das die Lovable-Veröffentlichung oder ein eigener Server bei dir? Davon hängt ab, ob Weg 1 oder 2 der richtige ist; ich helfe dir dann bei den nächsten Schritten.
