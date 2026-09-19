# WebSocket-Meldung auf prepare-panel.xyz beheben

## Ausgangslage

Auf der eigenen Domain erscheint die Meldung: „Node.js detected but native WebSocket not found. Suggested solution: Ensure you are running Node.js 22+ or provide a WebSocket implementation via the transport option."

Die Meldung kommt von der Live-Reload-Verbindung des Entwicklungsservers (Vite HMR): Der Browser versucht über `prepare-panel.xyz` eine WebSocket-Verbindung für die automatische Seitenaktualisierung aufzubauen. Über die Domain (HTTPS mit Proxy davor) schlägt das fehl, weil Protokoll/Port nicht zur Domain passen. Der Fehler ist beim **veröffentlichten (gebauten) Stand nicht vorhanden** – dort gibt es kein Live-Reload. Er betrifft nur den Zugriff auf die Vorschau über die eigene Domain.

## Änderung

In `vite.config.ts` die Live-Reload-Verbindung explizit auf die Domain konfigurieren:

```ts
vite: {
  server: {
    allowedHosts: ["prepare-panel.xyz", "www.prepare-panel.xyz"],
    hmr: {
      protocol: "wss",
      host: "prepare-panel.xyz",
      clientPort: 443,
    },
  },
},
```

Damit baut der Browser die Verbindung verschlüsselt (`wss://`) über Port 443 zur Domain auf – so wie es der Proxy vor der Vorschau erwartet.

## Hinweis

Sollte die Meldung danach in der Browser-Konsole weiterhin auftauchen, ist sie ein harmloser Hinweis der Entwicklungs-Vorschau: Die Seite selbst funktioniert, es fällt nur die automatische Aktualisierung bei Code-Änderungen weg. Der später veröffentlichte Stand (Publish) enthält diese Verbindung gar nicht und zeigt die Meldung nie.

## Technisch

- Nur `vite.config.ts` (Block `server.hmr` ergänzen).
- Keine Datenbank-, Server- oder Rechte-Änderungen.
- Keine neuen Abhängigkeiten.
