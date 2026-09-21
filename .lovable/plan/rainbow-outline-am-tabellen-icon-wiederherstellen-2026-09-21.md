# Rainbow-Outline am Tabellen-Icon wiederherstellen

## Ziel
Bei intern als „Erledigt“ markierten Aufträgen wird der animierte Regenbogen-Ring wieder sichtbar um das kleine Logo in der Vics-Tabelle angezeigt. Die bereits korrigierte Outline im Detail-Popup bleibt unverändert.

## Ursache
Die Ring-Klasse liegt bereits korrekt auf dem Logo-Element. Das Tabellen-Icon verwendet jedoch `overflow-hidden`, während der Rainbow-Ring über ein Pseudo-Element 2 px außerhalb des Elements gezeichnet wird. Dadurch wird der Ring vollständig abgeschnitten.

## Änderung
1. Den äußeren Logo-Rahmen in der Vics-Tabelle nicht mehr abschneiden lassen.
2. Das eigentliche Logo weiterhin innerhalb der abgerundeten Icon-Fläche begrenzen, damit Bild und Hintergrund sauber bleiben.
3. Die gleiche Darstellung für die interne Schwarz-Weiß-Kennzeichnung absichern; normale Status-Ringe und die lila Kennzeichnung bleiben unverändert.
4. Keine Änderung an den Auftrags-Cards im Detail-Popup oder an der Kennzeichnungslogik.

## Prüfung
- „Erledigt“: sichtbarer, sauber animierter Rainbow-Ring am Tabellen-Icon.
- „Abgesprungen“: sichtbarer Schwarz-Weiß-Ring.
- „Gestartet“ sowie normale Statusfarben bleiben korrekt.
- Tabellenzeile und benachbarte Logos werden nicht überlagert.
- Typprüfung und Build-Status kontrollieren.
