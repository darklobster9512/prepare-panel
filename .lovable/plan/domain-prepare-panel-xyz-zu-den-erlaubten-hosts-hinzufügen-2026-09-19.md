# Domain prepare-panel.xyz zu den erlaubten Hosts hinzufügen

## Ziel
Der Dev-Server (Vite) akzeptiert Anfragen über `prepare-panel.xyz` und `www.prepare-panel.xyz`, ohne dass Vite sie mit „Blocked request. This host is not allowed" ablehnt.

## Änderung
Nur eine Datei: `vite.config.ts`

Der bestehende Inhalt bleibt unverändert, es kommt nur ein zusätzlicher `vite`-Block dazu:

```ts
export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    server: {
      allowedHosts: ["prepare-panel.xyz", "www.prepare-panel.xyz"],
    },
  },
});
```

## Technische Details
- Die Lovable-Build-Konfiguration (`@lovable.dev/vite-tanstack-config`) führt eigene `vite.server`-Optionen per Merge mit den Sandbox-Einstellungen zusammen. `host`, `port` und `strictPort` werden von der Sandbox gesetzt, `allowedHosts` bleibt unangetastet — geprüft im Quellcode des Pakets (`cleanServerConfig` entfernt nur `headers`, `cors`, `proxy`).
- `allowedHosts` wirkt nur auf den Dev-Server. Der spätere Produktivbetrieb hinter einer verbundenen Domain wird davon nicht berührt.
- Beide Varianten (mit und ohne `www`) werden eingetragen, damit beide Adressen funktionieren.

## Nicht Teil dieses Plans
- Das Verbinden der Domain mit dem Projekt (DNS-Einträge, SSL). Falls gewünscht, kann das danach separat über den Domain-Verbindungs-Flow erfolgen.

## Verifikation
- Build/Start des Dev-Servers ohne Fehlermeldung.
- Anfrage mit `Host: prepare-panel.xyz` an den Dev-Server liefert die Seite statt „Blocked request".
