# Abrechnung-Reiter im Admin-Panel

## Ziel
Neuer Reiter „Abrechnung" unter `/admin/abrechnung`, auf dem du das Guthaben und den Verdienst aller Mitarbeiter siehst.

## Inhalt der Seite
- Oben eine **Gesamtübersicht**: Summe aller Guthaben, Anzahl erfolgreicher und fehlgeschlagener Aufträge über alle Mitarbeiter.
- Darunter eine **Karte pro Mitarbeiter** (Name/E-Mail aus dem Profil):
  - aktuelles Guthaben groß angezeigt,
  - Anzahl erfolgreich / fehlgeschlagen,
  - aufklappbarer **Verlauf** wie im Mitarbeiter-Panel: Datum, Auftrag (Logo + Name), Datensatz, Ergebnis, Betrag (+5,00 € / +2,50 €), neueste zuerst.
- Mitarbeiter ohne abgerechnete Aufträge erscheinen mit 0,00 €, damit du alle Konten siehst.

## Regeln (identisch zum Mitarbeiter-Panel)
- Erfolgreich = 5,00 €, Fehlgeschlagen = 2,50 €.
- Interne Kennzeichnungen (Gestartet/Erledigt/Abgesprungen) zählen als erfolgreich.
- Interne Aufträge (21bitcoin) zählen nie.
- Guthaben wird dem Mitarbeiter zugeordnet, der den Datensatz bearbeitet hat (`claimed_by`).
- Alles wird direkt aus den vorhandenen Aufträgen berechnet – bisherige Aufträge sind automatisch enthalten.

## Technische Details
- Keine Datenbankänderung nötig.
- `src/lib/abrechnung.functions.ts` erweitern um `getAdminAbrechnung` (`requireSupabaseAuth` + Admin-Rollenprüfung über `has_role`):
  - lädt alle `vic_auftraege` mit `vics.claimed_by` (nicht null), ohne `admin_only`-Aufträge;
  - lädt alle Mitarbeiter-Profile (`profiles` + `user_roles` mit Rolle `mitarbeiter`);
  - gruppiert die Einträge pro Mitarbeiter und rechnet in Cent; Rückgabe `{ total_cents, success_count, failed_count, mitarbeiter: [{ user_id, name, email, balance_cents, success_count, failed_count, entries[] }] }`.
- Neue Route `src/routes/_authenticated/admin.abrechnung.tsx` mit eigenem `head()` (noindex), gleiche Karten-/Listen-Optik wie die Mitarbeiter-Abrechnung, Verlauf pro Mitarbeiter aufklappbar.
- Navigationspunkt „Abrechnung" (Symbol Wallet) in die Admin-Navigation aller Admin-Seiten eintragen (die Nav-Arrays liegen jeweils inline in den `admin.*.tsx`-Dateien).
- Abschließend Typprüfung und Build prüfen.
