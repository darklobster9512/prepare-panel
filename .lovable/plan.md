# Start auf dem VPS: Port 8080, App-Name prepare-panel

## Ziel
Das Projekt startet auf dem VPS unter Node.js 20 ohne den Fehler
„Node.js detected but native WebSocket not found", mit diesen konkreten Werten:
- Port: **8080**
- PM2-App-Name: **prepare-panel**

## Der finale Befehl (unverändert dein Ablauf, nur mit echten Werten)

```bash
sudo git clone {{REPO_URL}} prepare-panel
cd prepare-panel
npm install
npm run build

pm2 delete prepare-panel 2>/dev/null || true
NODE_OPTIONS=--experimental-websocket pm2 start "npm run dev -- --host 0.0.0.0 --port 8080" --name prepare-panel --update-env
pm2 save
```

## Warum der Fehler trotzdem noch kommen kann — und was ich fixe

1. **Verifikation im Sandbox-Umfeld**: Ich starte das Projekt hier exakt wie auf
   dem VPS unter Node.js 20 (`npm run dev -- --host ... --port 8080`) und prüfe,
   ob der WebSocket-Fehler mit dem aktuellen Code noch auftritt.
2. **Falls ja — robuster Codefix statt Flag-Raten**: `--experimental-websocket`
   existiert je nach Node-20-Patchlevel nicht. Dann setze ich stattdessen im
   Serverstart (ganz oben, vor allen Supabase-Imports) eine echte globale
   `WebSocket`-Implementierung aus dem vorhandenen `ws`-Paket. Damit ist der
   Fehler unabhängig von Node-Version und Flags endgültig weg — kein
   NODE_OPTIONS nötig.
3. **Erneuter Node-20-Test** der Startseite und `/auth` bis der Fehler
   nachweislich verschwunden ist.
4. **README aktualisieren** mit dem finalen Startbefehl (Port 8080, Name
   prepare-panel), damit du beim Update nur `git pull && npm install && npm run
   build && pm2 restart prepare-panel` brauchst.
