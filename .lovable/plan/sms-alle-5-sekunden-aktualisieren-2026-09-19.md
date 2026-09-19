# SMS alle 5 Sekunden aktualisieren

## Ziel
In der Auftragsbearbeitung im Mitarbeiter-Panel soll der Bereich Telefonnummer neue eingehende SMS automatisch alle 5 Sekunden abrufen (bisher alle 30 Sekunden).

## Änderung
- In der Detailseite der Auftragsbearbeitung wird das Abrufintervall der SMS-Abfrage von 30 auf 5 Sekunden gesetzt.
- Der manuelle Aktualisieren-Knopf bleibt unverändert erhalten.
- Während des Abrufs bleibt die Liste sichtbar, es blitzt kein Ladezustand auf.

## Technisch
`src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`: `smsQuery` erhält `refetchInterval: 5000` (statt 30000), `refetchIntervalInBackground: false`, damit bei inaktivem Tab keine unnötigen AnoSIM-Aufrufe entstehen.
