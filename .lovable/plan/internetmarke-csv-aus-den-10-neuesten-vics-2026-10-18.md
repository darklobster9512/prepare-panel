# Internetmarke-CSV aus den 10 neuesten Vics

Ich erstelle eine CSV im Format der Musterdatei der Deutschen Post (Internetmarke).

## Inhalt

- Zeile 1: Überschriften `NAME;ZUSATZ;STRASSE;NUMMER;PLZ;STADT;LAND;ADRESS_TYP;REFERENZ`
- Zeile 2: Absender bleibt leer (nur LAND `DEU`, ADRESS_TYP `HOUSE`), du trägst ihn selbst ein
- Ab Zeile 3: die 10 zuletzt angelegten Vics mit vollständiger Adresse
  - NAME = Vorname(n) + Nachname
  - ZUSATZ und REFERENZ leer
  - STRASSE und NUMMER aus der Straßenzeile getrennt (z. B. "Höferweg 7" → "Höferweg" / "7")
  - PLZ, STADT aus dem Datensatz, LAND `DEU`, ADRESS_TYP `HOUSE`

## Ablauf

1. Die 10 neuesten Vics mit Straße, PLZ und Ort aus der Datenbank lesen.
2. CSV mit Semikolon, Excel-tauglicher Kodierung erzeugen, Feldlängen laut Muster prüfen.
3. Speichern als `internetmarke_import.csv` in Files.
