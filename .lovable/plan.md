# Santander-Rückmeldung bei Vladan Todorovic reparieren

## Ursache (geprüft)
- Der Santander-Auftrag ist vollständig: erfolgreich, PDF ist hochgeladen.
- Beim Übertragen wurde er aber unter dem Namen **„Santander-videoident"** gespeichert (das externe Panel hat ihn damals so geschickt, als die Santander-Vorlage noch Videoident war).
- Das Panel entscheidet anhand dieses Namens, was geschickt wird. Wegen „-videoident" wird Santander als Videoident behandelt: es schickt E-Mail/Ident-Link statt PDF. Ein Ident-Link fehlt, kein PDF dabei → die Gegenstelle lehnt mit 400 ab.

## Änderung
1. Ob ein Auftrag Postident ist, richtet sich künftig nach der **Auftragsvorlage** (Santander = Postident), nicht nach dem übertragenen Namen.
2. Der gesendete Name wird passend korrigiert: Bank-Teil bleibt, Endung wird aus der Vorlage genommen → „Santander-postident" mit PDF.
3. Bei Vladans Santander-Auftrag (und allen anderen mit falscher Endung) den gespeicherten Namen einmalig auf die richtige Endung korrigieren.
4. Danach Vladan einmal erneut senden und prüfen, dass die Gegenstelle annimmt. Kommt trotzdem 400, wird der Antworttext im Detailfenster angezeigt.

Hinweis: Beim erneuten Senden gehen alle Aufträge mit (BBVA erfolgreich, DKB fehlgeschlagen, Santander mit PDF), weil das externe Panel die Rückmeldung pro Anfrage als Ganzes erwartet.

## Technisch
- `src/lib/prepare-results.server.ts`: `isPost = t.ident_type === "postident"`; `auftrag` = Bankteil aus `source_name` + Suffix aus `t.ident_type`.
- Daten-Update auf `vic_auftraege.source_name`, wo Suffix nicht zum `ident_type` der Vorlage passt.
