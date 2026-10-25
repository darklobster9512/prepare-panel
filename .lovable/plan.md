# Supabase Edge Function: Vics von einem externen Panel übertragen

## Ziel
Dein externes Panel schickt Vic-Datensätze an eine öffentliche Supabase Edge Function. Jeder übertragene Datensatz erscheint danach sofort ganz oben in /admin/vics.

## Was übertragen wird
- Pflicht: Vorname(n), Nachname, Geburtsdatum, Geburtsort, Straße und Hausnummer, PLZ, Ort, Projekt
- Optional: Geburtsname, Familienstand, Steuer-ID, Aktuelle Bank
- Geburtsdatum als TT.MM.JJJJ oder JJJJ-MM-TT
- Projekt über den Namen (z. B. „LIMEX"), Groß-/Kleinschreibung egal. Unbekanntes Projekt wird abgelehnt.
- Ein Datensatz oder bis zu 200 auf einmal.

## Zugriff
- Öffentlich, ohne Schlüssel und ohne Anmeldung.
- Die Funktion kann nur neue Datensätze anlegen. Sie gibt keine vorhandenen Daten zurück, nichts kann darüber gelesen, geändert oder gelöscht werden.
- Wichtig: Wer die Adresse kennt, kann Datensätze anlegen. Gib die Adresse also nicht weiter. Ein Schlüssel lässt sich später jederzeit nachrüsten.

## Beispiel-Aufruf
```text
POST https://hppylojeoutwymkrqkek.supabase.co/functions/v1/import-vics
Body:
{
  "first_name": "Stefan Christian",
  "last_name": "Ehses",
  "birth_name": null,
  "birth_date": "24.07.1966",
  "birth_place": "Trier",
  "street": "Hordenbachstr. 10",
  "postal_code": "42369",
  "city": "Wuppertal",
  "marital_status": "ledig",
  "tax_id": "12345678901",
  "bank": "Sparkasse",
  "project": "LIMEX"
}
```
Antworten: 201 Erfolg (mit Anzahl), 400 fehlende/falsche Felder (deutsche Meldung je Feld).

## Technische Details
- Edge Function `supabase/functions/import-vics/index.ts` (Deno), in `supabase/config.toml` mit `verify_jwt = false`.
- Insert per Service-Role-Client (in Edge Functions automatisch vorhanden), `created_by = null`; nur INSERT, Antwort ohne Datensatzinhalte.
- Validierung mit zod inkl. Längenbegrenzung; Einzelobjekt oder `{ records: [...] }` (max. 200); CORS-Header für Aufrufe aus dem Browser.
- Projekt-Auflösung per `ilike` auf `projects.name`.
- Keine Datenbank-Änderung, keine Änderung an /admin/vics nötig.
- Nach dem Deploy Test: gültiger Datensatz, fehlende Pflichtfelder, unbekanntes Projekt; Testdatensatz danach löschen.
