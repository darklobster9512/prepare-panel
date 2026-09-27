# Pagination im Mitarbeiter-Verlauf (`/mitarbeiter/abrechnung`)

## Ziel
Der Verlauf zeigt pro Seite 20 Einträge. Darunter erscheint eine Seitennavigation („Zurück"/„Weiter" plus Seitenzahl „Seite X von Y"), solange es mehr als 20 Einträge gibt.

## Umsetzung
Nur `src/routes/_authenticated/mitarbeiter.abrechnung.tsx` wird geändert — die Daten kommen bereits vollständig und nach Datum sortiert vom Server, es reicht die Aufteilung im Frontend:

- Neuer State `page` (Startwert 1), `ENTRIES_PER_PAGE = 20`.
- Bei jedem frisch geladenen Verlauf wird der State auf 1 zurückgesetzt (damit nach neuen Auszahlungen wieder oben gestartet wird).
- Angezeigt werden `entries.slice((page - 1) * 20, page * 20)`.
- Unter der Liste: Zeile mit „Zurück" / „Weiter"-Buttons (deaktiviert an den Rändern) und der Anzeige „Seite X von Y"; mittig ausgerichtet, im bestehenden Stil (Rahmen-Buttons, dezent).
- Wenn der Verlauf 20 Einträge oder weniger hat, bleibt alles wie heute — keine Navigation.
- Die Guthaben-Anzeige oben (Gesamtübersicht, Zähler) bleibt unverändert und zeigt weiterhin die komplette Summe, nicht nur die aktuelle Seite.

## Nicht geändert
- Admin-Abrechnung (`/admin/abrechnung`) bleibt wie sie ist.
- Server-Logik, Auszahlungen, Berechnung: keine Änderung.
