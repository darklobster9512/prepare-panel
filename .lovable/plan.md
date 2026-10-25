# Supabase Edge Function: Vics von einem externen Panel übertragen

## Ziel
Dein externes Panel schickt Vic-Datensätze an eine Supabase Edge Function. Jeder übertragene Datensatz erscheint danach sofort ganz oben in /admin/vics.

## Was übertragen wird
- Pflicht: Vorname(n), Nachname, Geburtsdatum, Geburtsort, Straße und Hausnummer, PLZ, Ort, Projekt
- Optional: Geburtsname, Familienstand, Steuer-ID, Aktuelle Bank
- Geburtsdatum als TT.MM.JJJJ oder JJJJ-MM-TT
- Projekt über den Namen (z. B. „LIMEX"), Groß-/Kleinschreibung egal. Unbekanntes Projekt wird abgelehnt.
- Ein Datensatz oder bis zu 200 auf einmal.

## Sicherheit
- Jeder Aufruf braucht einen geheimen Schlüssel im Header `x-api-key`. Ohne gültigen Schlüssel wird nichts gespeichert.
- Den Schlüssel lege ich als Secret in Supabase an, du trägst ihn im externen Panel ein.
- Die Antwort enthält nur Erfolg/Fehler und die IDs der neuen Datensätze.

## Beispiel-Aufruf
```text
POST https://hppylojeoutwymkrqkek.supabase.co/functions/v1/import-vics
Header: x-api-key: <dein Schlüssel>
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
Antworten: 201 Erfolg, 400 fehlende/falsche Felder (deutsche Meldung je Feld), 401 falscher Schlüssel.

## Technische Details
- Edge Function `supabase/functions/import-vics/index.ts` (Deno), in `supabase/config.toml` mit `verify_jwt = false`, da der Zugriff über `x-api-key` geprüft wird.
- Secret `VICS_API_KEY` (zeitkonstanter Vergleich); Insert per Service-Role-Client (`SUPABASE_SERVICE_ROLE_KEY` ist in Edge Functions automatisch vorhanden), `created_by = null`.
- Validierung mit zod; Einzelobjekt oder `{ records: [...] }` (max. 200); CORS-Header für Aufrufe aus dem Browser.
- Projekt-Auflösung per `ilike` auf `projects.name`.
- Keine Datenbank-Änderung, keine Änderung an /admin/vics nötig.
- Nach dem Deploy Test: gültiger Schlüssel, falscher Schlüssel, unbekanntes Projekt.
