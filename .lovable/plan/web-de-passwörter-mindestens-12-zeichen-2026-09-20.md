# Web.de-Passwörter: mindestens 12 Zeichen

## 1. Kevin (Badergoll)

Sein Web.de-Passwort ist aktuell `Kevin096558` (11 Zeichen) und wird auf `Kevin096558!` geändert.

## 2. Neue Passwörter immer mindestens 12 Zeichen

Bei der Passwort-Erzeugung für Web.de (und alle anderen Aufträge mit Passwort-Generierung, außer BBVA mit seinem festen Muster Vorname+Jahr) werden künftig so lange weitere Ziffern angehängt, bis das Passwort mindestens 12 Zeichen hat. Kurze Vornamen bekommen also automatisch mehr Ziffern, z. B. `Soi` → `Soi123456789`.

## 3. Bestehende offene Datensätze prüfen und verlängern

Geprüft wurden alle Web.de-Zuweisungen. Zu kurz sind bei den noch nicht beanspruchten Datensätzen:

- Kevin Schulz — `Kevin987461` (11)
- Petra Gertrud Margarete Kusserow — `Petra475266` (11)
- Soi Julia Hartmann — `Soi790135` (9)

Diese drei werden durch angehängte Zufallsziffern auf 12 Zeichen verlängert. Alle übrigen offenen Datensätze haben bereits 12 oder mehr Zeichen. Abgeschlossene bzw. beanspruchte Datensätze bleiben unverändert (Ausnahme: Kevin Badergoll aus Punkt 1, wie gewünscht).

## Technisch

- `src/lib/password.ts`: `generateVicPassword` erhält eine Mindestlänge von 12; nach den 6 Basisziffern werden bei Bedarf weitere Zufallsziffern (`crypto.getRandomValues`) angehängt.
- Migration: gezieltes `UPDATE public.vic_auftraege` für die drei offenen Zuweisungen (Ziffern anhängen bis Länge 12) sowie das Setzen von `Kevin096558!` für Kevin Badergoll. Keine Schemaänderung.
