# Schnittstelle: Vics von einem externen Panel übertragen

## Ziel
Dein externes Panel schickt Vic-Datensätze an eine feste Adresse. Jeder übertragene Datensatz erscheint danach sofort ganz oben in /admin/vics.

## Was übertragen wird
- Vorname(n), Nachname, Geburtsdatum, Geburtsort, Straße und Hausnummer, PLZ, Ort, Projekt: Pflicht
- Geburtsname, Familienstand, Steuer-ID, Aktuelle Bank: optional
- Geburtsdatum wird als TT.MM.JJJJ oder JJJJ-MM-TT angenommen
- Projekt wird über den Namen angegeben (z. B. „LIMEX"), Groß- und Kleinschreibung egal. Gibt es das Projekt nicht, wird der Datensatz abgelehnt und die Antwort sagt warum.
- Du kannst einen Datensatz oder bis zu 200 auf einmal schicken.

## Sicherheit
- Jeder Aufruf braucht einen geheimen Schlüssel im Header `x-api-key`. Ohne gültigen Schlüssel wird nichts gespeichert.
- Den Schlüssel erzeuge ich als Secret, du trägst ihn danach im externen Panel ein.
- Die Antwort gibt nur zurück, ob es geklappt hat (plus die IDs der neuen Datensätze), keine anderen Daten.

## Beispiel-Aufruf
```text
POST https://process-prep-buddy.lovable.app/api/public/vics
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
Antworten: 201 bei Erfolg, 400 bei fehlenden oder falschen Feldern (mit deutscher Fehlermeldung je Feld), 401 bei falschem Schlüssel.

## Technische Details
- Auf diesem System ist das statt einer Supabase Edge Function ein Server-Endpunkt unter `src/routes/api/public/vics.ts` (POST). Er funktioniert für das externe Panel genauso.
- Neues Secret `VICS_API_KEY`, Vergleich zeitkonstant.
- zod-Validierung, Einzelobjekt oder `{ records: [...] }` (max. 200).
- Projekt-Auflösung per `ilike` auf `projects.name`; Insert über den Admin-Client (`client.server`, im Handler dynamisch geladen) mit `created_by = null`.
- Keine Änderung an Datenbank-Struktur oder /admin/vics nötig; die Liste lädt die neuen Datensätze automatisch.
- Nach dem Bau Test per curl: gültiger Schlüssel, falscher Schlüssel, unbekanntes Projekt.
- Hinweis: Der Endpunkt ist erst nach dem Veröffentlichen unter der festen Adresse erreichbar.
