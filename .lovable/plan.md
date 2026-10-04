# Auswahlliste für vorhandene Nummern neben „Neue Nummer kaufen"

## Ausgangslage
Im Fenster „Aufträge zuweisen" gibt es die Auswahl schon, sie erscheint aber nur, wenn freie Nummern vorhanden sind. Sonst sieht man sie gar nicht. Deshalb wirkt es so, als fehle sie.

## Änderung (nur `src/routes/_authenticated/admin.vics.tsx`)
- Auswahlliste + „Zuweisen"-Button stehen immer direkt neben dem Button „Neue Nummer kaufen", in einer Zeile.
- Jeder Eintrag zeigt Nummer + „gültig bis TT.MM.JJJJ".
- Angezeigt werden nur Nummern aus dem AnoSIM-Konto, die keinem Datensatz zugewiesen und noch nicht abgelaufen sind (bestehende Filterlogik in `listAssignableNumbers`).
- Zustände in der Liste: „Lädt …", „Keine freien Nummern vorhanden" (Liste deaktiviert) und eine Fehlermeldung, falls AnoSIM nicht erreichbar ist.
- Infotext angepasst: „Neue Nummer kaufen oder eine freie Nummer aus dem AnoSIM-Konto auswählen."
- Nach dem Zuweisen oder Kaufen wird die Liste neu geladen, damit vergebene Nummern verschwinden.

## Unverändert
Server-Funktionen, Datenbank, Kauf-Dialog, „Zuweisung entfernen".
