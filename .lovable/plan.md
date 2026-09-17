# Telefonnummer pro Vic-Datensatz

Im Popup „Aufträge zuweisen" (/admin/vics) kommt ganz oben eine Karte für die Telefonnummer des Datensatzes.

## Verhalten

**Noch keine Nummer zugewiesen**
- Die Karte zeigt: „Diesem Datensatz ist noch keine Telefonnummer zugewiesen."
- Auswahlfeld mit bereits gekauften, noch freien Nummern (nicht abgelaufen, keinem anderen Datensatz zugewiesen) und Button „Zuweisen".
- Button „Neue Nummer kaufen" → Bestätigungsfenster mit Land Deutschland, FullService, 30 Tage und aktuellem Preis. Erst nach „Kaufen bestätigen" wird gekauft; die gekaufte Nummer wird sofort diesem Datensatz zugewiesen.

**Nummer zugewiesen**
- Die Karte zeigt die Nummer groß, daneben ein Kopier-Symbol, darunter „Gültig bis TT.MM.JJJJ" und die Restlaufzeit (z. B. „noch 21 Tage"), bei abgelaufener Nummer ein Hinweis „abgelaufen".
- Die Nummer gilt für alle Aufträge dieses Datensatzes; sie lässt sich nicht pro Auftrag ändern.
- Kleiner Link „Zuweisung entfernen" (mit Rückfrage), falls eine Nummer versehentlich zugewiesen wurde – die Nummer bleibt im AnoSIM-Konto und wird wieder frei.

Pro Datensatz ist genau eine Nummer möglich, und eine Nummer gehört zu höchstens einem Datensatz.

## Technisch

Migration:
- `ALTER TABLE public.anosim_numbers ADD COLUMN IF NOT EXISTS vic_id uuid REFERENCES public.vics(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS end_date timestamptz;`
- `CREATE UNIQUE INDEX IF NOT EXISTS anosim_numbers_vic_id_key ON public.anosim_numbers (vic_id) WHERE vic_id IS NOT NULL;` (erzwingt 1 Nummer pro Datensatz)
- Bestehende RLS/Grants (nur Admin) bleiben unverändert.

`src/lib/anosim.functions.ts`:
- `buyAnosimNumber` bekommt optionales `vicId`; beim Upsert werden `vic_id` und `end_date` (aus der Buchungsantwort) mitgeschrieben.
- Neu: `listAssignableNumbers` – Buchungen von AnoSIM + Zuordnungen aus `anosim_numbers`, liefert freie Nummern (kein `vic_id`, `endDate` in der Zukunft).
- Neu: `assignNumberToVic({ vicId, orderBookingId })` und `unassignNumberFromVic({ vicId })`; beide mit `requireSupabaseAuth` + `assertAdmin`, deutsche Fehlermeldungen; Zuweisen prüft, dass die Nummer frei ist.
- `listAnosimNumbers` liefert zusätzlich `vicId`, damit /admin/telefonnummern später erkennen kann, welche Nummer vergeben ist.

`src/lib/vics.functions.ts`:
- `VicRow` bekommt `phone_number: string | null` und `phone_end_date: string | null`; `listVics` lädt die Zuordnung aus `anosim_numbers` (Join über `vic_id`) und mappt sie mit.

`src/routes/_authenticated/admin.vics.tsx`:
- Im Zuweisen-Dialog oberhalb der Auftragsliste die neue Karte.
- Query `["admin","anosim","assignable"]`, Query auf den FullService-Produktpreis (`getAnosimFullServiceProduct`) nur wenn das Kauf-Bestätigungsfenster offen ist.
- Mutations für Kaufen, Zuweisen, Entfernen mit `invalidateQueries` auf Vics und Nummern; Meldungen inline auf Deutsch (kein Toaster).
- Bestätigungsfenster als eigener `Dialog` mit Preis, fixem Text „Deutschland · FullService · 30 Tage" und Buttons „Abbrechen" / „Kaufen bestätigen"; Ladezustand während des Kaufs.
