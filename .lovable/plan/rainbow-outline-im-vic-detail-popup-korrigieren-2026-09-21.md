# Rainbow-Outline im Vic-Detail-Popup korrigieren

## Ziel
Die „Erledigt“-Kennzeichnung behält eine klare Regenbogen-Outline, ohne dass sich der rechteckige Rahmen sichtbar im Kreis dreht oder über die Auftrags-Card hinauswandert.

## Änderungen
1. Die aktuelle Rotation der kompletten `::after`-Rahmenebene entfernen.
2. Den Regenbogen als stabilen, sauber an der Card-Kante ausgerichteten Rahmen darstellen.
3. Falls Bewegung beibehalten wird, nur den Farbverlauf dezent entlang des festen Rahmens animieren; bei reduzierten Bewegungseinstellungen bleibt er statisch.
4. Die kleine Rainbow-Outline an den Auftragslogos in der Vics-Tabelle ebenfalls prüfen, damit Card und Logo sauber dargestellt werden.
5. Die schwarz-weiße und lila Kennzeichnung unverändert lassen, sofern sie durch die gemeinsame Rahmenregel nicht betroffen sind.

## Prüfung
- Detail-Popup mit „Erledigt“-Auftrag auf Desktop öffnen und die feste Card-Geometrie prüfen.
- Mini-Logo in der Vics-Tabelle kontrollieren.
- Darstellung ohne Überlagerung, Abschneiden oder kreisende Rechteckbewegung prüfen.
- Typprüfung und aktuellen Build-Status kontrollieren.

## Technische Details
Die Ursache liegt in `transform: rotate(1turn)` auf dem rechteckigen Pseudo-Element des Rahmens. Die Korrektur animiert nicht mehr dessen Geometrie, sondern höchstens den Farbverlauf innerhalb eines unveränderten Rahmens.
