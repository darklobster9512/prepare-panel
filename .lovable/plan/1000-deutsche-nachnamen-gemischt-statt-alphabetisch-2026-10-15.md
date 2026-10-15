# 1000 deutsche Nachnamen – gemischt statt alphabetisch

## Ziel
Eine Textdatei mit denselben 1000 deutschen Nachnamen wie bisher, aber in gemischter Reihenfolge statt alphabetisch sortiert.

## Umsetzung
- Die bereits verwendeten 1000 Namen unverändert übernehmen (keine neuen Namen hinzufügen, keine entfernen).
- Die Reihenfolge per Zufall mischen.
- Als neue Datei `deutsche-nachnamen-gemischt.txt` in `/mnt/documents` speichern – die alphabetische `deutsche-nachnamen.txt` bleibt erhalten.
- UTF-8, eine Zeile pro Name, ohne Nummerierung.
- Vor der Bereitstellung prüfen: genau 1000 Zeilen, keine Dubletten, identische Namensmenge wie die alphabetische Datei, und dass die Reihenfolge tatsächlich nicht mehr alphabetisch ist.

## Keine Codeänderung
Es ändert sich nichts am Projekt – nur die TXT-Datei wird erzeugt und als Artefakt bereitgestellt.
