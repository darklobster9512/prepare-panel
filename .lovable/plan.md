# Rückmeldung an externes Panel: 400-Fehler beheben

## Ursache (per Testanfrage an die Gegenstelle bestätigt)
Das externe Panel prüft die Daten streng und lehnt ab, wenn:
1. ein Feld leer (`null`) mitgeschickt wird – z. B. fehlender IDnow-/WebID-Link, fehlendes PDF, fehlende E-Mail oder Share-Link. Antwort: "Expected string, received null".
2. die `request_id` keine UUID ist. Antwort: "Invalid uuid".

Unser Panel schickt fehlende Werte bisher als `null` und speichert nur "Gegenstelle antwortete mit 400" – den eigentlichen Grund nicht.

## Änderungen
- Leere Felder weglassen statt `null` senden (E-Mail, Identlink, Anosim-Link, Anmeldename, Passwort, PDF).
- Die genaue Fehlerbegründung der Gegenstelle mitspeichern und im Admin-Detailfenster anzeigen, z. B. "400: request_id – Invalid uuid".
- Fehlt bei einem erfolgreichen Postident-Auftrag das PDF, wird das im Fehlertext klar genannt.

## Hinweis
Ist die gespeicherte `request_id` selbst keine UUID, muss das externe Panel die richtige ID schicken – das kann unser Panel nicht reparieren. Die neue Fehleranzeige macht das dann sichtbar.

## Technisch
`src/lib/prepare-results.server.ts`: null-Werte aus den Einträgen entfernen; bei `!res.ok` `await res.text()` (gekürzt) in `results_error` übernehmen.
