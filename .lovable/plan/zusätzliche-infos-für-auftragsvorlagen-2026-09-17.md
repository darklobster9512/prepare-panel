# Zusätzliche Infos für Auftragsvorlagen

Im Popup „Auftrag hinzufügen / bearbeiten" (auf /admin/vics) kommen drei neue Angaben dazu.

## Was neu ist

1. **Ident-Art**: zwei Auswahlknöpfe – „Videoident" oder „Postident". Keine Pflichtangabe, kann auch leer bleiben.
2. **Besonderheiten**: ein mehrzeiliges Textfeld für Hinweise zum Auftrag.
3. **Bilder**: beliebig viele Bilder hochladen (z. B. Screenshots). Im Popup erscheinen sie als kleine Vorschaubilder, jedes lässt sich einzeln wieder entfernen.

Alles wird beim Speichern übernommen und beim erneuten Öffnen des Bearbeiten-Popups wieder angezeigt.

Auf der Auftragskarte erscheint unter dem Namen ein kleines Label mit „Videoident" bzw. „Postident" (nur wenn gesetzt).

## Technische Details

- Migration: `ALTER TABLE public.auftraege ADD COLUMN IF NOT EXISTS ident_type text CHECK (ident_type IN ('videoident','postident')), ADD COLUMN IF NOT EXISTS besonderheiten text, ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb;` (Bilder als Array von Storage-Pfaden). Bestehende RLS/Grants bleiben unverändert.
- `src/lib/auftraege.functions.ts`: `AuftragRow` und `auftragSchema` um `ident_type` (enum, nullable), `besonderheiten` (nullable) und `images` (string[]) erweitern; SELECT-Spalten, `createAuftrag` und `updateAuftrag` entsprechend ergänzen.
- `src/components/auftraege-section.tsx`:
  - Zustände `identType`, `besonderheiten`, `images` (bestehende Pfade) und `newImageFiles` (neue Dateien mit Objekt-URL-Vorschau); in `resetForm`/`openEdit` mitführen.
  - Formular: Radiogruppe (native Radio-Inputs, Design-Tokens), `Textarea` für Besonderheiten, Datei-Input `multiple accept="image/*"` plus Vorschauraster mit Entfernen-Knopf.
  - Beim Speichern neue Dateien nacheinander in den bestehenden Bucket `auftrag-logos` hochladen (Unterordner `bilder/<uuid>.<ext>`), Pfade an die Server-Funktion übergeben. Vorhandene Bilder-Vorschau über `resolveAuftragLogo` (signierte URLs).
  - Karte: kleines Label mit dem Ident-Typ unter dem Namen.
- Fehlermeldungen deutsch und inline, Styling nur über vorhandene Design-Tokens.
