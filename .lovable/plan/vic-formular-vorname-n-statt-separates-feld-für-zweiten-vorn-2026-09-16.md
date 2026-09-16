# Vic-Formular: Vorname(n) statt separates Feld für zweiten Vornamen

## Änderung

Im Dialog „Vic hinzufügen / bearbeiten" auf /admin/vics entfällt das Eingabefeld „Zweiter Vorname". Das erste Feld heißt künftig **„Vorname(n)"** – mehrere Vornamen (z. B. „Stefan Christian") werden einfach mit Leerzeichen in dieses eine Feld eingegeben und in der Spalte `first_name` gespeichert.

## Umsetzung

1. **src/routes/_authenticated/admin.vics.tsx**
   - Label „Vorname" → „Vorname(n)".
   - Feld „Zweiter Vorname" (middle_name) aus dem Formular entfernen: FormState, emptyForm, openEdit und das Grid (Vorname(n) + Nachname in einer zweispaltigen Reihe).
   - Tabellenanzeige „Name" zeigt `first_name` + `last_name` (ohne middle_name); Suchfilter ohne middle_name.

2. **src/lib/vics.functions.ts**
   - `middle_name` aus vicSchema, VicRow-Typ und SELECT-Spalten entfernen; Update schreibt middle_name nicht mehr.

3. **Datenbank (eine Migration)**
   - Einmalige Übernahme bestehender Werte: `middle_name` (falls gefüllt) an `first_name` anhängen, damit keine Daten verloren gehen; danach `middle_name` in allen Zeilen auf NULL setzen. Die Spalte bleibt bestehen (nur ungenutzt).

Layout, Pflichtfelder (nur Vorname(n) + Nachname), deutsche Meldungen und alle übrigen Felder bleiben unverändert.
