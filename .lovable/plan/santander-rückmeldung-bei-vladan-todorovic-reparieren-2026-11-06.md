# Santander-Rückmeldung bei Vladan Todorovic reparieren

## Ursache (geprüft)
- Der Santander-Auftrag ist vollständig: erfolgreich, PDF ist hochgeladen.
- Er ist aber unter dem Namen **„Santander-videoident"** gespeichert (so kam er damals vom externen Panel).
- Wegen „-videoident" schickt das Panel E-Mail und Ident-Link statt PDF. Der Ident-Link fehlt, ein PDF ist nicht dabei, deshalb lehnt die Gegenstelle mit 400 ab.

## Änderung
1. **Santander und Consorsbank werden immer als „-postident" übertragen (mit PDF), niemals als Videoident**, egal wie sie gespeichert oder angelegt sind. Bei allen anderen Banken entscheidet die Auftragsvorlage.
2. Bei Vladan und allen anderen betroffenen Aufträgen den gespeicherten Namen einmalig auf „Santander-postident" bzw. „Consorsbank-postident" korrigieren.
3. Danach Vladan einmal erneut senden und prüfen, dass die Gegenstelle annimmt. Kommt trotzdem 400, steht der Antworttext im Detailfenster.

Hinweis: Beim erneuten Senden gehen alle Aufträge mit (BBVA erfolgreich, DKB fehlgeschlagen, Santander mit PDF), weil das externe Panel die Rückmeldung pro Anfrage als Ganzes erwartet.

## Technisch
- `src/lib/prepare-results.server.ts`: `isPost = bank in {santander, consorsbank} || t.ident_type === "postident"`; gesendeter Name = Bankteil + Endung passend zu `isPost`.
- Daten-Update: `vic_auftraege.source_name` für Santander/Consorsbank auf `-postident`.
