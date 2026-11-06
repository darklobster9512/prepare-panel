# Rückmeldung an das andere Panel: Ankommen prüfen und sichtbar machen

## Was feststeht
- Das andere Panel hat Vladan Todorovics Rückmeldung um 14:47 Uhr mit „OK“ angenommen. Deshalb gibt es keine Fehlermeldung mehr.
- Was es mit den Daten macht, sieht mein Panel im Moment nicht. Der Antworttext bei Erfolg wird nicht gespeichert.

## Wahrscheinliche Ursache (noch nicht bestätigt)
- Das andere Panel hat Vladans Santander-Auftrag als „Santander-videoident“ angelegt. So stand er auch bei uns gespeichert.
- Wir schicken jetzt „Santander-postident“. Wenn das andere Panel nach dem genauen Namen sucht, findet es keinen passenden Auftrag. Dann sagt es trotzdem „OK“, ordnet aber nichts zu.

## Schritte
1. **Antwort speichern und anzeigen:** Bei jedem Senden wird gespeichert, was das andere Panel zurückmeldet, auch bei Erfolg. Im Detailfenster unter Vics steht der Text dann unter „Gesendet am …“.
2. **Vladan einmal erneut senden** und die Antwort lesen. Danach steht fest, ob der Name oder etwas anderes das Problem ist.
3. **Je nach Antwort:**
   - Wenn es am Namen liegt: Wir schicken den Namen, unter dem das andere Panel den Auftrag angelegt hat. Bei falsch angelegten Aufträgen muss das andere Panel selbst „-postident“ verwenden. Darauf hat mein Panel keinen Einfluss.
   - Wenn etwas anderes dahintersteckt (falsche Anfrage-ID, PDF abgelehnt, Feldname falsch): genau das beheben.
4. Prüfen, ob es bei Vladan im anderen Panel ankommt. Das kann ich nur über die Antwort sehen, nicht im anderen Panel selbst. Bitte dort danach kurz nachschauen.

## Frage an dich
Weißt du, ob das andere Panel Vladans Auftrag als „Santander-videoident“ oder „Santander-postident“ führt? Falls „-videoident“, liegt der Fehler mit hoher Wahrscheinlichkeit dort.

## Technisch
- `prepare-results.server.ts`: `res.text()` auch bei 2xx lesen und gekürzt in einer neuen Spalte `vics.results_response text` speichern.
- Migration: Spalte `results_response`. Admin `ResultsStatus` zeigt den Text an.
- Danach `sendVicResults` für Vladan neu auslösen und den Antworttext prüfen.
