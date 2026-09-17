# Passwort generieren bei Auftragsvorlagen

Im Popup „Auftrag hinzufügen / bearbeiten" (auf /admin/vics) kommt eine neue Einstellung dazu.

## Was neu ist

1. **Schalter „Passwort generieren"**: an oder aus, Standard aus. Wird beim Speichern übernommen und beim erneuten Öffnen wieder angezeigt.
2. Unter dem Schalter steht der Hinweis auf die Regel: Vorname + 6 zufällige Ziffern (z. B. Stefan856102, Jacqueline746291).
3. Bei den bestehenden Aufträgen **Web.de**, **DKB** und **BBVA** wird der Schalter direkt aktiviert.

Vorerst wird nur die Einstellung gespeichert – es wird noch nirgends ein Passwort angezeigt oder erzeugt.

## Technische Details

- Migration: `ALTER TABLE public.auftraege ADD COLUMN IF NOT EXISTS generate_password boolean NOT NULL DEFAULT false;` plus `UPDATE public.auftraege SET generate_password = true WHERE name IN ('Web.de','DKB','BBVA');` Bestehende RLS/Grants bleiben unverändert.
- `src/lib/auftraege.functions.ts`: `AuftragRow` und `auftragSchema` um `generate_password: boolean` erweitern; SELECT-Spalten, `createAuftrag` und `updateAuftrag` ergänzen (Default `false`).
- `src/components/auftraege-section.tsx`: Zustand `generatePassword`, in `resetForm`/`openEdit` mitführen, im Formular als `Switch` (shadcn) mit Label und Hinweistext, im Payload mitsenden.
- Neue Hilfsfunktion `generateVicPassword(firstName)` in `src/lib/password.ts`: erster Vorname ohne Leer-/Sonderzeichen + 6 Ziffern aus `crypto.getRandomValues`. Wird für den späteren Einsatz vorbereitet und noch nicht in der Oberfläche verwendet.
- Styling nur über vorhandene Design-Tokens, Meldungen deutsch und inline.
