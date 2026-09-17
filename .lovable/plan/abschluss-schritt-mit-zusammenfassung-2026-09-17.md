# Abschluss-Schritt mit Zusammenfassung

Wenn alle Aufträge eines Datensatzes als erfolgreich oder fehlgeschlagen markiert sind, bekommt der Mitarbeiter einen zusätzlichen, letzten Schritt: eine Zusammenfassung, die er bestätigen muss. Danach landet er wieder auf der Übersicht und der Datensatz ist als abgeschlossen markiert.

## Ablauf

```text
E-Mail → DKB → Deutsche Bank → ... → Santander → [ Zusammenfassung ]
                                                        |
                                            "Abschluss bestätigen"
                                                        |
                                    zurück zur Übersicht, Status: Abgeschlossen
```

## Der Zusammenfassungs-Schritt

- Erscheint in der Schritt-Leiste als letzter Punkt (Häkchen-Symbol). Anklickbar erst, wenn kein Auftrag mehr offen ist; vorher grau mit Hinweis "Noch X Aufträge offen".
- Sobald der letzte Auftrag markiert wurde, springt der Wizard automatisch auf diesen Schritt.
- Inhalt der Zusammenfassung:
  - Name des Datensatzes, Telefonnummer und erstellte E-Mail-Adresse
  - Liste aller Aufträge mit Logo, Name, Ergebnis (Erfolgreich/Fehlgeschlagen) und den jeweils eingetragenen Daten (verwendeter Anmeldename, Passwort, WebID- bzw. Postident-Link)
  - Zähler oben: "X erfolgreich · Y fehlgeschlagen"
- Button "Abschluss bestätigen" mit kurzer Rückfrage ("Danach kannst du nichts mehr ändern."). Danach automatisch zurück zur Übersicht.

## Nach dem Abschluss

- Der Datensatz erscheint auf der Übersicht im Abschnitt "Abgeschlossen" mit Datum und einem grünen Hinweis "Abgeschlossen am …".
- Die Detailseite bleibt zum Ansehen offen, alle Eingabefelder und die Erfolgreich/Fehlgeschlagen-Knöpfe sind deaktiviert; oben steht ein Hinweisbalken.
- Im Admin-Bereich (/admin/vics) zeigt die Zeile den Abschluss-Status an: ein grünes Häkchen-Abzeichen neben dem Namen, sobald der Datensatz abgeschlossen ist.

## Technische Umsetzung

**Migration**
- `vics.completed_at timestamptz null`, `vics.completed_by uuid null`
- RLS: bestehende Mitarbeiter-Update-Policy auf `vics` deckt diese Spalten bereits ab (claimed_by = auth.uid()). Zusätzlich wird die Mitarbeiter-Update-Policy auf `vic_auftraege` so ergänzt, dass Änderungen nur möglich sind, solange `vics.completed_at IS NULL`.

**Server**
- `src/lib/mitarbeiter.functions.ts`: neue Funktion `finishVic` (requireSupabaseAuth, `assertClaimed`, prüft dass kein zugewiesener Auftrag mehr `status = 'offen'` hat, setzt `completed_at`/`completed_by`, gibt das aktualisierte `WorkItem` zurück). `completeAuftrag` und `saveEmailAddress` brechen mit deutscher Fehlermeldung ab, wenn `completed_at` bereits gesetzt ist.
- `SELECT_COLUMNS` und `WorkItem` (`src/lib/mitarbeiter.types.ts`) um `completed_at`/`completed_by` erweitern.
- `src/lib/vics.functions.ts`: `VicRow` um `completed_at` ergänzen (für die Admin-Tabelle).

**UI**
- `mitarbeiter.auftraege.$vicId.tsx`: `StepBar` bekommt einen zusätzlichen Summary-Eintrag; neue Komponente `SummaryCard`; `current` kann den Index `steps.length` annehmen; `onSaved` springt auf den Summary-Schritt, wenn kein Auftrag mehr offen ist; `editable` wird `false`, sobald `completed_at` gesetzt ist; `useNavigate` zurück auf `/mitarbeiter/auftraege` nach Bestätigung, mit `invalidateQueries` auf `["mitarbeiter","work-items"]`.
- `mitarbeiter.auftraege.index.tsx`: Abschnitt "Erledigt" umbenennen in "Abgeschlossen" und über `completed_at` filtern; Datensätze mit allen Aufträgen fertig, aber ohne Bestätigung, bleiben unter "Meine Aufträge" mit Knopf "Abschließen".
- `admin.vics.tsx`: kleines grünes "Abgeschlossen"-Abzeichen in der Namensspalte, wenn `completed_at` gesetzt ist.
