# Telefonnummer pro Vic-Datensatz – nur Neukauf, keine Auswahl

## Ziel
Im Popup „Aufträge zuweisen" (/admin/vics) steht oben die Telefonnummer-Karte. Änderung: Es gibt **keine Auswahl vorhandener Nummern** mehr. Jeder Datensatz bekommt ausschließlich eine **neu gekaufte** Nummer (Deutschland · FullService · 30 Tage), die dann fest diesem Datensatz zugewiesen ist und für alle seine Aufträge gilt.

## Verhalten

### Karte „Telefonnummer" im Zuweisen-Popup
- **Nummer zugewiesen:** Nummer groß mit Kopier-Symbol, „Gültig bis TT.MM.JJJJ · noch X Tage", Hinweis „Gilt für alle Aufträge dieses Datensatzes." Link „Zuweisung entfernen" (mit Rückfrage) – die Nummer bleibt im AnoSIM-Konto, wird aber nicht mehr angeboten.
- **Keine Nummer zugewiesen:** Nur der Button **„Neue Nummer kaufen"**. Kein Auswahlfeld, keine Liste freier Nummern.

### Kauf-Ablauf
1. Klick auf „Neue Nummer kaufen" öffnet ein Bestätigungsfenster: fester Text „Deutschland · FullService · 30 Tage", aktueller Preis (aus AnoSIM), Buttons „Abbrechen" / „Kaufen bestätigen".
2. Nach Bestätigung: Kauf, Nummer wird sofort diesem Datensatz zugewiesen (vic_id + end_date in `anosim_numbers`), Karte zeigt danach die neue Nummer.

## Technik
- **Entfernen** aus `src/routes/_authenticated/admin.vics.tsx`: `freeNumbersQuery` (listAssignableNumbers), `selectedNumber`-State, `assignNumberMutation`, das Auswahlfeld samt „Zuweisen"-Button.
- **Behalten:** `listAssignableNumbers` und `assignNumberToVic` in `src/lib/anosim.functions.ts` bleiben im Code (keine Löschung nötig), werden aber von der Seite nicht mehr aufgerufen.
- **Behalten:** Kauf-Bestätigungs-Dialog (buyOpen, productQuery, buyNumberMutation mit vicId), Telefonnummer-Karte mit Gültigkeit, „Zuweisung entfernen" (unassignNumberFromVic).
- Datenbank unverändert: `anosim_numbers.vic_id` (unique, 1 Nummer pro Datensatz) + `end_date`.
- Danach: `bunx tsgo --noEmit` und curl-Check auf /admin/vics.
