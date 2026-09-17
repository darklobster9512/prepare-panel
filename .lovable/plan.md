# 21bitcoin im Vic-Detailfenster ergänzen

## Umsetzung
- Im Admin-Detailfenster eines Vic-Datensatzes das generierte Passwort ausschließlich bei internen Aufträgen wie 21bitcoin anzeigen.
- Die bisherige Regel für normale Aufträge beibehalten: Dort werden weiterhin nur final verwendete Daten angezeigt.
- Das Status-Abzeichen „Intern“ unabhängig vom automatisch erfolgreichen Status in Lila darstellen.
- Die bereits lila Umrandung des internen Auftrags unverändert beibehalten.

## Technische Details
- Die vorhandenen Felder `admin_only` und `password` aus der Vic-Abfrage verwenden; es ist keine Datenbankänderung nötig.
- Im Auftragsblock eine eigene interne Passwortzeile mit Kopierfunktion ergänzen.
- Die Abzeichen-Klassen zuerst nach `admin_only` bestimmen, damit Grün für „erfolgreich“ das lila Intern-Design nicht überschreibt.
- Abschließend Typprüfung und aktuellen Build-Status kontrollieren.
