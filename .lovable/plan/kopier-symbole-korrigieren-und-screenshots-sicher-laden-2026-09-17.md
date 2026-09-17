# Kopier-Symbole korrigieren und Screenshots sicher laden

## Kopier-Symbole entfernen

In den Feldern, die Mitarbeitende selbst ausfüllen, kommt kein Kopier-Symbol mehr:

- Verwendeter Anmeldename
- Verwendetes Passwort
- WebID-Link
- Postident-Link

Die Kopier-Symbole bei den **generierten** und **angezeigten** Werten bleiben: generierter Anmeldename, generiertes Passwort, Telefonnummer, erstellte E-Mail, generierte Adresse/Geburtsdatum sowie die Datensatz-Karte.

## Screenshots im INFOS-Fenster

Die Bilddateien liegen tatsächlich im Ablageordner und sind korrekt mit den Aufträgen verknüpft — geprüft. Die Anzeige holt sich bisher im Browser selbst einen zeitlich begrenzten Link für jede Datei; scheitert das einmal (z. B. weil die Freigabe zu dem Zeitpunkt noch fehlte), wird das Fehlschlagen für die gesamte Sitzung gemerkt und das Bild bleibt dauerhaft leer.

Umstellung auf einen zuverlässigen Weg:

- Die Links werden künftig serverseitig erzeugt und an die Seite geliefert — unabhängig von den Leserechten des jeweiligen Kontos.
- Fehlschläge werden nicht mehr dauerhaft gemerkt: beim erneuten Öffnen wird neu versucht.
- Während des Ladens erscheint ein ruhiger Platzhalter statt der Meldung „Bild nicht verfügbar"; die Meldung kommt nur noch, wenn die Datei wirklich fehlt.

## Technisch

- `src/lib/storage.functions.ts` (neu): `getAuftragFileUrls` mit `.middleware([requireSupabaseAuth])`, nimmt eine Pfadliste entgegen, lädt `supabaseAdmin` innerhalb des Handlers (`await import("@/integrations/supabase/client.server")`) und gibt `createSignedUrls(paths, 3600)` als `Record<path, url>` zurück. zod-Validierung, deutsche Fehlermeldungen.
- `src/components/auftrag-logo.tsx`: `resolveAuftragLogo` ruft die Server-Funktion auf (gebündelt pro Pfad, Cache nur bei Erfolg, `signedUrlCache.delete(path)` bei `null`/Fehler). `AuftragLogo` bekommt einen `loading`-Zustand, damit `fallback` nicht schon beim Laden erscheint. Blob-/Data-/http-Pfade bleiben unverändert direkt.
- `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`: bei den vier Eingabefeldern `copyable={false}` setzen; `Field`-Standard auf `copyable = false` umstellen.
- Keine Datenbank-Änderung nötig; die bestehende Leserechte-Regel bleibt.
