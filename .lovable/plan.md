# Plan: Mitarbeiter-Aufträge erst anzeigen, wenn Logos geladen sind

## Ziel
Auf der Seite `/mitarbeiter/auftraege` soll die Auftragsliste nicht erst mit Platzhaltern erscheinen und danach die Logos nachladen. Stattdessen bleibt die Seite im Ladezustand, bis die benötigten Auftragslogos vorbereitet sind.

## Umsetzung
- Einen kleinen Preload-Helfer für Auftragsbilder ergänzen:
  - alle Logo-Pfade sammeln,
  - doppelte Pfade entfernen,
  - signierte Bild-Links gebündelt laden,
  - den bestehenden Logo-Cache befüllen.
- In `/mitarbeiter/auftraege` nach dem Laden der Auftragsdaten alle sichtbaren Auftragslogos vorladen.
- Solange Daten oder Logos noch laden, weiterhin nur „Wird geladen …" anzeigen.
- Wenn ein einzelnes Logo nicht geladen werden kann, soll die Seite trotzdem weitergehen und wie bisher den Text-Platzhalter zeigen.
- Beim Wechsel zwischen „Meine Aufträge", „Verfügbar" und „Abgeschlossen" werden dieselben bereits geladenen Logos aus dem Cache genutzt, damit kein erneutes Flackern entsteht.

## Detailseite
- Auf der Detailseite `/mitarbeiter/auftraege/:vicId` denselben Preload nutzen, damit die Step-Logos und INFOS-Bilder nicht sichtbar nachspringen.
- Die eigentlichen Screenshots im INFOS-Fenster bleiben weiterhin über den bestehenden großen Bild-Viewer anklickbar.

## Technische Details
- Änderung in `src/components/auftrag-logo.tsx`: Preload-Funktion exportieren, die den vorhandenen `signedUrlCache` befüllt.
- Änderung in `src/routes/_authenticated/mitarbeiter.auftraege.index.tsx`: Logo-Pfade aus `items` sammeln und mit React Query/Effect vorladen.
- Änderung in `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`: Logo- und Screenshot-Pfade des Datensatzes vorladen, bevor der Inhalt angezeigt wird.
- Keine Datenbankänderung und keine Änderung an Rechten oder Auftragslogik.
