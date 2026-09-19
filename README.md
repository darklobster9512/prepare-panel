# IdentPanel

Internes Panel zur Vorbereitung von Unternehmensprozessen: Vic-Datensätze,
Projekte, Auftragsvorlagen, Telefonnummern und die schrittweise Abarbeitung
durch Mitarbeitende.

## Entwicklung

```sh
bun install
bun run dev
```

Die Anwendung läuft anschließend unter http://localhost:8080.

## Betrieb auf eigenem Server (PM2)

Node.js 22 oder neuer wird vorausgesetzt.

```sh
npm install
npm run build
pm2 start "npm run dev -- --host 0.0.0.0 --port 3000" --name identpanel
pm2 save
```

`npm run dev` erkennt automatisch, ob ein Produktions-Build vorliegt: Ist
`.output/server/index.mjs` (bzw. `dist/server/index.mjs`) vorhanden, startet der
Produktionsserver ohne Live-Reload. Ohne Build startet der Entwicklungsserver.
Alternativ direkt: `npm start`.

Nach einem neuen Build muss der PM2-Prozess neu gestartet werden
(`pm2 restart identpanel`).

## Technik

React, TypeScript, TanStack Start, Tailwind CSS, shadcn/ui und Supabase.
