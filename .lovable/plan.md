# Guthaben-System für Mitarbeiter

## Regeln
- Jeder Mitarbeiter hat ein eigenes Guthaben.
- Auftrag als **Erfolgreich** markiert: **+5,00 €**
- Auftrag als **Fehlgeschlagen** markiert: **+2,50 €**
- Der Mitarbeiter wählt nur Erfolgreich oder Fehlgeschlagen; danach ist der Status endgültig und ändert sich nicht mehr.
- Aufträge, die du als Admin intern als **Gestartet, Erledigt oder Abgesprungen** gekennzeichnet hast, zählen immer als **Erfolgreich (5,00 €)**. Diese Kennzeichnung ist rein intern und für den Mitarbeiter unsichtbar.
- Unbearbeitete Aufträge zählen nicht.
- **21bitcoin** (und alle anderen internen Aufträge) zählt nie.
- Gutgeschrieben wird dem Mitarbeiter, der den Datensatz bearbeitet hat.

## Nachträgliche Berechnung
Das Guthaben wird direkt aus den vorhandenen Aufträgen berechnet. Dadurch sind alle bisherigen Aufträge automatisch enthalten, und es ist nichts separat zu übertragen.

## Neuer Reiter „Abrechnung“ im Mitarbeiter-Panel
- Oben eine große Anzeige mit dem **aktuellen Guthaben** und darunter die Anzahl erfolgreicher und fehlgeschlagener Aufträge.
- Darunter der **Verlauf**, neueste Einträge zuerst: Datum, Auftrag (Logo und Name, z. B. Deutsche Bank), Datensatz (Vor- und Nachname), Ergebnis (Erfolgreich/Fehlgeschlagen) und Betrag (+5,00 € / +2,50 €).
- Jeder Mitarbeiter sieht nur sein eigenes Guthaben. Admins werden wie bisher auf ihren eigenen Bereich weitergeleitet.

## Technische Details
- Es ist keine Datenbankänderung nötig. Die Berechnung stützt sich auf `vic_auftraege` (`status`, `internal_mark`, `completed_at`), `auftraege.admin_only` und `vics.claimed_by`.
- Neue Datei `src/lib/abrechnung.functions.ts` mit `getMyAbrechnung` (`requireSupabaseAuth`):
  - lädt Aufträge von Vics mit `claimed_by = userId`, ohne `admin_only`;
  - zählt einen Auftrag, wenn `internal_mark` gesetzt ist (5 €) oder `status` erfolgreich (5 €) bzw. fehlgeschlagen (2,50 €) ist;
  - verwendet als Datum `completed_at`, sonst `updated_at`;
  - gibt `{ balance, successCount, failedCount, entries[] }` zurück und rechnet intern in Cent.
- Neue Route `src/routes/_authenticated/mitarbeiter.abrechnung.tsx` mit eigenem `head()` (noindex) im bestehenden PDF-/Panel-Stil. Die Daten werden über `useQuery` geladen, Beträge werden als de-DE EUR formatiert.
- In `src/lib/mitarbeiter-nav.ts` kommt der Menüpunkt „Abrechnung“ (Symbol Wallet) dazu.
- Abschließend Typprüfung und Build prüfen.
