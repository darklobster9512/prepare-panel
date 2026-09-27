# Auszahlungen in der Abrechnung

## Ziel
Auf `/admin/abrechnung` bekommt jede Mitarbeiter-Karte einen Button „Auszahlen". Er öffnet ein Popup mit einem Betragsfeld (vorausgefüllt mit dem aktuellen Guthaben). Nach Bestätigen wird die Auszahlung notiert, das Guthaben des Mitarbeiters reduziert sich entsprechend, und im Verlauf erscheint ein Eintrag „Auszahlung" — bei dir im Admin-Panel und beim Mitarbeiter in seiner Abrechnung.

## Ablauf
- Button „Auszahlen" pro Mitarbeiter-Karte (nur sichtbar, wenn Guthaben > 0 €).
- Popup: Betragsfeld in Euro, vorausgefüllt mit dem vollen Guthaben; frei änderbar.
- Prüfung: Betrag muss größer 0 € sein und darf das aktuelle Guthaben nicht übersteigen — das wird auch serverseitig geprüft, damit kein Minus entstehen kann.
- Nach Bestätigen: Eintrag „Auszahlung −X,XX €" im Verlauf (mit Datum), Guthaben sinkt sofort.

## Technische Details
- Neue Tabelle `payouts` (Felder: Mitarbeiter, Betrag in Cent, wer die Auszahlung angelegt hat) mit Zugriffsregeln: Mitarbeiter sehen nur ihre eigenen Auszahlungen, Admins können alle sehen und anlegen.
- Neue Server-Function `createPayout` in `src/lib/abrechnung.functions.ts` (nur Admins): prüft den Betrag gegen das aktuell berechnete Guthaben und speichert die Auszahlung.
- Guthaben-Berechnung in `getMyAbrechnung` und `getAdminAbrechnung` erweitern: Guthaben = Verdienst − Summe der Auszahlungen. Auszahlungen erscheinen im Verlauf als eigene Einträge mit negativem Betrag, zeitlich einsortiert.
- `admin.abrechnung.tsx`: „Auszahlen"-Button und Bestätigungs-Popup pro Mitarbeiter-Karte; nach erfolgreicher Auszahlung werden die Daten neu geladen und eine Erfolgsmeldung gezeigt.
- `mitarbeiter.abrechnung.tsx`: keine weiteren Änderungen nötig — Auszahlungs-Einträge kommen automatisch über die erweiterte Berechnung in den Verlauf.
- Abschließend Typprüfung und Build prüfen.
