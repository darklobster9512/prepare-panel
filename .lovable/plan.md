# Bilder laden auf dem eigenen Server nicht

## Ursache (geprüft)

Die Bank-Logos, Screenshots und das GoLogin-Logo liegen in einem privaten Supabase-Ordner. Für jedes Bild erzeugt der Server einen signierten Link — dafür braucht er den Admin-Schlüssel (`SUPABASE_SERVICE_ROLE_KEY`).

Der Schlüssel steht zwar in der mitgelieferten `.env`, aber beim Start mit `npm run dev` landen aus dieser Datei nur die Werte mit `VITE_`-Vorsatz in der App. Alle übrigen Werte — Admin-Schlüssel, AnoSIM, Telegram — kommen beim Server nie an. In Lovable funktioniert es, weil die Umgebung dort diese Werte direkt setzt.

Ergebnis: Anmeldung und Seiten laden (die nutzen die `VITE_`-Werte), aber jede Bildanfrage schlägt still fehl. Aus demselben Grund funktionieren auf dem Server auch Telefonnummern (AnoSIM) und Telegram nicht.

## Lösung

Beim Start liest das Projekt die `.env` künftig vollständig ein und stellt alle Werte dem Server zur Verfügung — egal ob über `npm run dev` oder einen fertigen Build. Kein manuelles Setzen, kein geänderter Startbefehl.

Zusätzlich: Wenn der Admin-Schlüssel wirklich einmal fehlt, erscheint statt leerer Bilder eine klare Meldung im Server-Log, damit die Ursache sofort sichtbar ist.

## Technische Umsetzung

- In `vite.config.ts` per `loadEnv("", process.cwd(), "")` alle Variablen aus `.env`/`.env.production` laden und die noch nicht gesetzten nach `process.env` schreiben (echte Umgebungsvariablen behalten Vorrang). Das läuft im selben Node-Prozess wie der SSR-Server, daher sehen `client.server.ts`, `anosim.server.ts` und die Telegram-Funktionen die Werte.
- Ergänzend in `src/server.ts` als allererstes eine kleine `.env`-Ladefunktion, damit auch ein Produktionsstart ohne Vite (`npm start` / Nitro-Ausgabe) dieselben Werte hat.
- `getAuftragFileUrls` in `src/lib/storage.functions.ts`: Supabase-Fehlertext mit `console.error` protokollieren statt zu verschlucken.
- Bestehendes bleibt unverändert: `"dev": "vite"`, Supabase 2.110.5, `allowedHosts`, der PM2-Startbefehl.

## Auf dem Server danach

```bash
cd prepare-panel
git pull
npm install
npm run build
pm2 restart prepare-panel
```
