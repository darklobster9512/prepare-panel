# Vic-Datensätze im Admin-Panel

Neuer Reiter **Vics** unter `/admin/vics`, erreichbar über die Seitenleiste im Admin-Panel. Nur Administratoren haben Zugriff.

## Was du bekommst

- **Tabellenansicht** aller Vic-Datensätze mit Name, Geburtsdatum, Geburtsort, Ort, Familienstand, Bank und Anlagedatum. Leere Angaben bleiben einfach leer.
- **Neuen Datensatz anlegen** über einen Button, der ein Formular öffnet. Pflicht sind nur Vorname und Nachname, alles andere ist optional.
- **Bearbeiten und Löschen** je Zeile: Bearbeiten öffnet dasselbe Formular mit den vorhandenen Werten, Löschen fragt vorher nach einer Bestätigung.
- **Suche** über Name, Ort und Steuer-ID, damit du in längeren Listen schnell findest.
- Deutsche Rückmeldungen bei Erfolg und Fehlern, Liste aktualisiert sich selbst.

## Felder

Vorname, zweiter Vorname (optional), Nachname, Geburtsdatum, Geburtsort, Straße und Hausnummer, Postleitzahl, Ort, Familienstand, Steuer-ID, aktuelle Bank, Notizen.

Damit passen beide Beispielformate: der vollständige Datensatz ebenso wie der knappe „Name, Geburtsdatum in Ort, Adresse".

## Optik

Gleicher Raisin-Stil wie das übrige Panel: helle Karten, feine Linien, blaue Aktionsbuttons, Plus Jakarta Sans. Keine neuen Farben.

## Technische Details

- Migration: Tabelle `public.vics` mit `id`, `first_name`, `middle_name`, `last_name`, `birth_date` (date), `birth_place`, `street`, `postal_code`, `city`, `marital_status`, `tax_id`, `bank`, `notes`, `created_by`, `created_at`, `updated_at` plus `update_updated_at_column`-Trigger. GRANTs für `authenticated` und `service_role`, RLS aktiviert, alle Policies (lesen/anlegen/ändern/löschen) über `has_role(auth.uid(), 'admin')`. Kein `anon`-Zugriff.
- `src/lib/vics.functions.ts`: Server-Funktionen `listVics`, `createVic`, `updateVic`, `deleteVic` mit `.middleware([requireSupabaseAuth])`, zod-Validierung und demselben `assertAdmin`-Muster wie `admin-users.functions.ts`.
- `src/routes/_authenticated/admin.vics.tsx`: Route `/admin/vics`, `head()` mit noindex, React Query (`useQuery` + `useMutation` + `invalidateQueries`), Dialog-Formular für Anlegen/Bearbeiten, Bestätigung vor dem Löschen, Inline-Meldungen (kein Toaster im Projekt).
- Seitenleisten-Einträge in `admin.index.tsx` und `admin.mitarbeiter.tsx` um „Vics" → `/admin/vics` ergänzen.
- Nicht-Admins werden clientseitig zu `/mitarbeiter` geleitet, serverseitig blockt `assertAdmin`.
