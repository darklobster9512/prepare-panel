# Vics-Tabelle: Sortierung beim Projekt-Zuweisen fixieren

## Problem
In der Vics-Tabelle (/admin/vics) springt die Reihenfolge der Zeilen, wenn man einem Datensatz per Dropdown ein Projekt zuweist. Die Tabelle soll immer nach Anlagezeitpunkt sortiert bleiben – neueste Datensätze oben.

## Ursache
- Datensätze, die im selben Moment angelegt wurden (z. B. über den Schnell-Import), tragen denselben Zeitstempel. Die Datenbank kann bei gleichem Zeitstempel die Reihenfolge nicht eindeutig bestimmen – bei jedem Neuladen (auch nach dem Zuweisen) kommt die Liste in leicht anderer Reihenfolge zurück.
- Nach dem Zuweisen wird die Liste komplett neu geladen, dadurch wird die instabile Reihenfolge sichtbar.

## Lösung (nur Code-Änderungen, keine Datenbank-Änderung)
1. **Stabile Sortierung serverseitig** (src/lib/vics.functions.ts): `listVics` sortiert zusätzlich zum Zeitstempel nach der Datensatz-ID als fester Tie-Breaker. Gleiche Zeitstempel liefern damit immer dieselbe Reihenfolge – kein Vertauschen mehr beim Neuladen.
2. **Kein vollständiges Neuladen beim Zuweisen** (src/routes/_authenticated/admin.vics.tsx): Nach dem Zuweisen/Entfernen eines Projekts wird nur der betreffende Datensatz direkt im Speicher der Seite aktualisiert (Projektname und Projektzuordnung) – die Tabelle bleibt stehen, es wird nicht neu sortiert oder geflasht. Die Projekt-Aktion zeigt weiterhin die Erfolgsmeldung „Projekt zugewiesen.".
   - Anlegen, Importieren, Bearbeiten und Löschen behalten das vollständige Neuladen – dadurch erscheinen neue Datensätze korrekt oben.

## Ergebnis
Die Tabelle bleibt nach dem Zuweisen eines Projekts an Ort und Stelle stehen – Reihenfolge immer: neueste Datensätze oben.

## Verifizierung
- Typprüfung (tsgo) fehlerfrei, Build OK
- Seite /admin/vics lädt (HTTP 200), Projekt-Zuweisung über Dropdown aktualisiert die Zelle ohne Zeilenverschiebung
