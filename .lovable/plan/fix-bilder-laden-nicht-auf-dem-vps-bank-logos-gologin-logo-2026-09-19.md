# Fix: Bilder laden nicht auf dem VPS (Bank-Logos, GoLogin-Logo)

## Ursachen (im Code bestätigt)

1. **Bank-Logos / Screenshots**: `src/lib/storage.functions.ts` erzeugt die
   Bild-Links serverseitig mit dem Admin-Zugang und braucht dafür
   `SUPABASE_SERVICE_ROLE_KEY`. Dieser Wert fehlt in der mitgelieferten
   `.env` — auf dem VPS schlägt das Erzeugen der Links daher fehl und alle
   Logos/Screenshots bleiben leer. Gleiches betrifft Telefonnummern (AnoSIM)
   und Telegram.
2. **GoLogin-Logo**: Es liegt als CDN-Zeiger (`gologin-logo.svg.asset.json`)
   mit einer relativen Adresse `/__l5e/...`, die nur auf Lovable-Hosting
   existiert. Auf dem eigenen VPS führt die Adresse ins Leere (404).

## Maßnahmen

1. **`.env` vervollständigen**: `SUPABASE_SERVICE_ROLE_KEY`,
   `ANOSIM_API_KEY` und `TELEGRAM_BOT_TOKEN` werden in die git-tracked
   `.env` geschrieben. Vite liest sie beim Start automatisch — du musst auf
   dem VPS nichts manuell setzen.
2. **GoLogin-Logo lokal einbetten**: SVG aus dem CDN herunterladen, als
   normale Datei `src/assets/gologin-logo.svg` ins Projekt legen, in
   `mitarbeiter.onboarding.tsx` direkt importieren und den CDN-Zeiger
   löschen. Damit lädt das Logo auf jedem Server.
3. **Verifikation**: Startseite, `/auth`, `/mitarbeiter/auftraege` und
   `/mitarbeiter/onboarding` testen — Logos müssen sichtbar sein; Build muss
   ohne Fehler durchlaufen.

## VPS-Update danach

```bash
cd prepare-panel
git pull
npm install
npm run build
pm2 restart prepare-panel
```

Keine Änderung an deinem Startbefehl (Port 8080, Name prepare-panel).
