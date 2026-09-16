# Auftragsvorlagen als Karten auf /admin/vics

Über der Vic-Tabelle entsteht ein Kartenbereich "Aufträge". Jede Karte zeigt das hochgeladene Logo und den Namen eines Auftrags. Ganz am Ende der Kartenreihe steht eine gestrichelte Karte mit einem großen [+].

## Was du sehen wirst

- Überschrift "Aufträge" mit kurzer Beschreibung, darunter ein Raster aus Karten (Logo oben, Name darunter).
- Klick auf die [+]-Karte öffnet ein Popup: Logo/Icon hochladen (Bilddatei, mit Vorschau) und Name eingeben (Pflichtfeld). Speichern legt die Karte an.
- Beim Überfahren einer Karte erscheinen oben rechts zwei kleine Symbole: Stift (umbenennen / Logo austauschen) und Papierkorb (löschen mit Rückfrage).
- Karten selbst sind vorerst nicht anklickbar.
- Sortierung: neueste Karte zuletzt bzw. nach Anlagedatum; Meldungen wie im Rest des Panels auf Deutsch, inline.
- Die Vic-Tabelle darunter bleibt unverändert.

## Technische Umsetzung

**Speicher**
- Neuer Storage-Bucket `auftrag-logos` (privat) über das Bucket-Tool; RLS-Policies auf `storage.objects` per Migration: Lesen/Schreiben/Löschen nur für Admins (`has_role(auth.uid(),'admin')`).
- Anzeige über signierte URLs (gleiches Muster wie im Referenzprojekt: Pfad in der DB, `createSignedUrl` im Client, Cache pro Pfad).

**Datenbank (Migration)**
- Tabelle `public.auftraege` mit `id`, `name text not null`, `logo_path text`, `created_by uuid references auth.users on delete set null`, `created_at`, `updated_at`.
- GRANTs für `authenticated` und `service_role`, RLS an, alle Policies über `has_role(auth.uid(),'admin')`, `update_updated_at_column`-Trigger.

**Server-Funktionen** – neue Datei `src/lib/auftraege.functions.ts`
- `listAuftraege`, `createAuftrag`, `updateAuftrag`, `deleteAuftrag`, jeweils `.middleware([requireSupabaseAuth])`, zod-Validierung und das bestehende `assertAdmin`-Muster.
- Der Datei-Upload läuft direkt aus dem Browser über den Supabase-Storage-Client (Session vorhanden, Policies greifen); gespeichert wird nur der Pfad.

**Frontend**
- Neue Komponente `src/components/auftrag-logo.tsx` (signierte URL auflösen, Fallback-Kachel).
- `src/routes/_authenticated/admin.vics.tsx`: Kartenbereich oberhalb der Tabelle, eigener Dialog für Anlegen/Bearbeiten (Datei-Input mit Vorschau + Namensfeld), React Query (`useQuery`/`useMutation` + `invalidateQueries`), `window.confirm` vor dem Löschen.
- Styling nur über die vorhandenen Design-Tokens (Raisin-Farben), keine festen Farbwerte.
