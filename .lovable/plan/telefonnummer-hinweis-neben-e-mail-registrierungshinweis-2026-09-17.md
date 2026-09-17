# Telefonnummer-Hinweis neben E-Mail-Registrierungshinweis

## Ziel
Im Mitarbeiter-Wizard soll in jedem Bank-Auftrags-Schritt unter dem bestehenden Hinweis „Für die Registrierung verwenden: <E-Mail>" eine gleichartige Zeile mit der zugewiesenen Telefonnummer stehen.

## Umsetzung
Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` (Bank-Schritt-Zweig, Zeilen ~862–873)

- Unter die bestehende E-Mail-Hinweis-Box eine zweite Box im gleichen Stil setzen:
  `<span className="text-muted-foreground">Für die Registrierung verwenden: </span>` + `<strong>{item.phone_number}</strong>`
- Nur anzeigen, wenn `item.phone_number` vorhanden ist; sonst keine zweite Box (die Telefonnummer ist bereits oben in der Schritt-Karte sichtbar).
- Keine Kopier-Funktion nötig (Nummer ist oben schon kopierbar), reiner Hinweistext wie beim E-Mail-Hinweis.

Keine Datenbank-, Server- oder Rechte-Änderungen.
