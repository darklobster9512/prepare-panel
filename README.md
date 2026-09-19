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

Node.js 20 oder neuer wird unterstützt.

```sh
npm install
npm run build
pm2 start "npm run dev -- --host 0.0.0.0 --port 3000" --name identpanel
pm2 save
```

`npm run dev` startet wie beim Referenzprojekt direkt Vite. Die Argumente für
Host und Port werden unverändert an Vite weitergegeben.

Nach einem neuen Build muss der PM2-Prozess neu gestartet werden
(`pm2 restart identpanel`).

### Benötigte Zugangsdaten

Die benötigten Supabase-Werte sind bereits in der mitgelieferten `.env`
enthalten. Vite liest diese Datei beim Start automatisch aus dem Projektordner.

| Wert | Zweck |
| --- | --- |
| `SUPABASE_URL` | Pflicht |
| `SUPABASE_PUBLISHABLE_KEY` | Pflicht |
| `SUPABASE_SERVICE_ROLE_KEY` | Mitarbeiterverwaltung, Dateizugriff |
| `ANOSIM_API_KEY` | Telefonnummern |
| `TELEGRAM_BOT_TOKEN` | Benachrichtigungen |

Die beiden Pflichtwerte stehen bereits in `.env`. Die übrigen Schlüssel sind
dort aus Sicherheitsgründen nicht enthalten und müssen auf dem Server ergänzt
werden.

## Technik

React, TypeScript, TanStack Start, Tailwind CSS, shadcn/ui und Supabase.
