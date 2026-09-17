# Nachträglich zugewiesene Aufträge wieder öffnen

## Ziel

Wenn du einem bereits abgeschlossenen Datensatz später einen weiteren Auftrag zuweist, taucht er beim selben Mitarbeiter wieder unter „Meine Aufträge" auf, und er kann die neuen Bankaufträge ganz normal abarbeiten.

## Verhalten

- Neuer Auftrag auf einen abgeschlossenen Datensatz → Abschluss-Markierung wird zurückgenommen, die Zuweisung an den Mitarbeiter bleibt bestehen.
- Der Datensatz wandert aus „Abgeschlossen" zurück in „Meine Aufträge" (Knopf „Weiterarbeiten").
- Bereits erledigte Aufträge behalten ihren Status und ihre eingetragenen Daten; nur der neue Auftrag ist offen.
- Im Wizard sind die alten Schritte wieder sichtbar, der neue Schritt ist bearbeitbar; E-Mail-Adresse und Telefonnummer bleiben wie gehabt.
- Nach dem Erledigen des neuen Auftrags kommt erneut der Zusammenfassungs-Schritt und der Datensatz wird wieder abgeschlossen.
- Interne Aufträge (21bitcoin) lösen das nicht aus – sie gelten sofort als erledigt und sind für Mitarbeiter unsichtbar.
- Ist der Datensatz noch von niemandem beansprucht, ändert sich nichts: er bleibt unter „Verfügbar".

## Technische Umsetzung

- `src/lib/vic-auftraege.functions.ts` → `assignAuftrag`: nach dem erfolgreichen Insert eines nicht-internen Auftrags den Vic laden; ist `completed_at` gesetzt, `completed_at = null` und `completed_by = null` setzen (`claimed_by`/`claimed_at` unverändert). Admin-Rechte reichen dafür aus.
- Die bestehende RLS-Regel für Mitarbeiter auf `vic_auftraege` (nur solange `vics.completed_at IS NULL`) greift danach automatisch wieder.
- Keine Migration, keine UI-Änderung nötig: Übersicht filtert bereits über `completed_at`, der Wizard über den offenen Status.
