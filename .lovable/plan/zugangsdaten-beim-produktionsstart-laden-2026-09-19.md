# Zugangsdaten beim Produktionsstart laden

## Ursache

Der Vite-Entwicklungsserver hat die Datei `.env` automatisch eingelesen. Der jetzt laufende Produktionsserver tut das nicht — Node startet ohne diese Werte, deshalb die Meldung zu fehlenden Supabase-Angaben. Es liegt nicht am Build, sondern nur daran, dass die Werte beim Start nicht gesetzt werden.

## Umsetzung

- Das Startskript liest vor dem Start der Anwendung die Datei `.env` aus dem Projektordner ein und übergibt die Werte an den Produktionsserver. Bereits vorhandene Werte aus der Umgebung (z. B. von PM2 gesetzt) haben Vorrang und werden nicht überschrieben.
- Zusätzlich wird eine optionale Datei `.env.production` unterstützt, falls du auf dem Server abweichende Werte hinterlegen willst.
- Fehlt beim Start eine zwingend nötige Angabe, gibt der Server eine klare deutsche Meldung mit der Liste der fehlenden Werte aus, statt erst beim Seitenaufruf abzustürzen.
- Die Projektdokumentation bekommt eine vollständige Liste der Werte, die auf dem Server vorhanden sein müssen.

## Werte, die auf dem VPS gesetzt sein müssen

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY   (für Administrationsfunktionen)
ANOSIM_API_KEY              (Telefonnummern)
TELEGRAM_BOT_TOKEN          (Benachrichtigungen)
```

Die ersten beiden stehen bereits in der mitgelieferten `.env`. Der Dienstschlüssel sowie die beiden Schlüssel für Telefonnummern und Telegram sind aus Sicherheitsgründen nicht in der Datei enthalten — sie müssen auf dem Server ergänzt werden, sonst funktionieren Mitarbeiterverwaltung, Telefonnummern und Benachrichtigungen dort nicht.

## Prüfung

- Produktions-Build erzeugen, Server über deinen bestehenden Befehl starten und prüfen, dass die Startseite und die Anmeldeseite ohne Supabase-Fehler laden.
- Gegenprobe ohne gesetzte Werte: Es erscheint die verständliche Startmeldung mit der Liste der fehlenden Angaben.

## Dein Ablauf bleibt unverändert

```text
npm install
npm run build
pm2 start "npm run dev -- --host 0.0.0.0 --port {{PORT}}" --name {{APP_NAME}}
pm2 save
```
