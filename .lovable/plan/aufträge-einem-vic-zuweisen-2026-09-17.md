# Aufträge einem Vic zuweisen

In der Vic-Tabelle (/admin/vics) bekommt jede Zeile in der Spalte „Aktionen" einen **[+]-Button**. Damit weist du dem Datensatz Aufträge zu.

## Wie es sich anfühlt

- Klick auf [+] öffnet ein kleines Fenster mit allen Aufträgen (Logo + Name).
- Ein Vic kann **mehrere Aufträge** haben; bereits zugewiesene sind markiert und lassen sich einzeln wieder entfernen.
- Neue Spalte **„Aufträge"** in der Tabelle: die Logos der zugewiesenen Aufträge klein nebeneinander (mit Namen als Tooltip), bei vielen z. B. „+3".
- Beim Zuweisen werden automatisch die Zugangsdaten erzeugt, sofern der Auftrag das vorsieht:
  - Passwort = Vorname + 6 zufällige Ziffern (z. B. Stefan856102)
  - Anmeldename = Nachname + Geburtsjahr, mind. 8 Zeichen (z. B. Steen79, Ehses1966)
  - Fehlt das Geburtsdatum, bleibt der Anmeldename leer und es erscheint ein Hinweis.
- Die erzeugten Zugangsdaten stehen im selben Fenster bei der jeweiligen Zuweisung und lassen sich per Klick kopieren; ein Knopf erlaubt Neu-Erzeugen.
- Die Tabelle springt beim Zuweisen nicht um – Reihenfolge bleibt (neueste oben).

## Technisch

- Migration: neue Tabelle `public.vic_auftraege` (`id`, `vic_id` → `vics(id)` ON DELETE CASCADE, `auftrag_id` → `auftraege(id)` ON DELETE CASCADE, `login_name text`, `password text`, `created_at`, `updated_at`, UNIQUE(vic_id, auftrag_id), Index auf vic_id). GRANTs für `authenticated` und `service_role`, RLS an, alle Policies über `has_role(auth.uid(), 'admin')`, `update_updated_at_column`-Trigger.
- `src/lib/password.ts`: bestehende `generateVicPassword` + `generateVicLoginName` werden wiederverwendet.
- `src/lib/vic-auftraege.functions.ts` (neu): `assignAuftrag`, `unassignAuftrag`, `regenerateCredentials` – alle mit `requireSupabaseAuth`, `assertAdmin`, zod-Validierung, deutsche Fehlermeldungen. Die Zugangsdaten werden serverseitig aus Vic-Daten + Auftrags-Einstellungen (`generate_password`, `generate_loginname`) erzeugt.
- `listVics` liefert pro Datensatz die zugewiesenen Aufträge mit (`vic_auftraege(auftrag_id, login_name, password, auftraege(name, logo_path))`); `VicRow` bekommt `auftraege: VicAuftrag[]`.
- `src/routes/_authenticated/admin.vics.tsx`: neue Spalte „Aufträge" mit Mini-Logos (`AuftragLogo`), [+]-Button in der Aktionen-Spalte, Dialog mit Auftragsliste zum An-/Abwählen, Anzeige der Zugangsdaten je Zuweisung, Kopieren-Buttons, Meldungen inline. Nach Änderungen wird der betroffene Datensatz über `setQueryData` aktualisiert, damit die Sortierung stehen bleibt.
