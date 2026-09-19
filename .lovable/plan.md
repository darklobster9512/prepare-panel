# Bilder direkt über Supabase-CDN laden

## Geprüfter Zustand

- Der Bucket `auftrag-logos` existiert und enthält die hochgeladenen Logos und Screenshots.
- Er ist derzeit **privat**. Deshalb funktionieren direkte CDN-Links nicht; die App versucht stattdessen, über den eigenen Server kurzlebige signierte Links zu erzeugen.
- Das GoLogin-Logo liegt noch unter `src/assets` und wird in das gebaute JavaScript-Paket eingebunden, statt als feste öffentliche Datei ausgeliefert zu werden.

## Umsetzung

1. Den bestehenden Supabase-Bucket `auftrag-logos` auf öffentlich stellen.
2. Bank-Logos und Auftrags-Screenshots direkt über Supabase Storage CDN laden:
   ```text
   https://<supabase-projekt>.supabase.co/storage/v1/object/public/auftrag-logos/<dateipfad>
   ```
   Damit hängt die Bildanzeige weder vom externen Node-Server noch vom Admin-Schlüssel ab.
3. `AuftragLogo` und die Vorladefunktion auf diese direkten CDN-Links umstellen; bestehende vollständige URLs und lokale Bilder bleiben kompatibel.
4. Die serverseitige Signierfunktion aus der Bildanzeige entfernen. Uploads und Verwaltung durch Admins bleiben unverändert geschützt.
5. Das GoLogin-Logo nach `public/gologin-logo.svg` verschieben und auf der Onboarding-Seite fest als `/gologin-logo.svg` laden.
6. Mitarbeiter-Auftragsübersicht, Auftrags-Wizard, Admin-Ansichten und Onboarding visuell prüfen.

## Wichtiger Zugriffshinweis

Durch den öffentlichen Bucket sind Dateien für jeden erreichbar, der ihre schwer erratbare URL kennt. Das ist für öffentliche Bank-Logos passend; die dort ebenfalls gespeicherten Auftrags-Screenshots werden dadurch genauso direkt erreichbar. Tabellen und Kontodaten bleiben weiterhin geschützt.

## Danach auf dem VPS

```bash
cd prepare-panel
git pull
npm install
npm run build
pm2 restart prepare-panel
```
