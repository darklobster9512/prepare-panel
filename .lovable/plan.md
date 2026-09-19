# Generiertes Passwort bei Web.de anzeigen

## Ursache

Web.de ist als Auftrag vom Typ „E-Mail" hinterlegt. Im Mitarbeiter-Panel hat der E-Mail-Schritt ein eigenes Layout (generierte Adresse, Geburtsdatum, Eingabefeld für die verwendete E-Mail-Adresse). In diesem Layout wird das generierte Passwort schlicht nicht ausgegeben – es erscheint nur bei den Bank-Aufträgen.

Das Passwort existiert also, es ist zu jedem Datensatz gespeichert, wird dem Mitarbeiter nur nicht gezeigt.

## Lösung

Im E-Mail-Schritt dieselbe Anzeige ergänzen wie bei den anderen Aufträgen:

- „Generierter Anmeldename" und „Generiertes Passwort" mit Kopier-Symbol, jeweils nur wenn vorhanden.
- Platzierung direkt unter den generierten Adressdaten, oberhalb des Felds „Verwendete E-Mail-Adresse".

Sonst bleibt alles unverändert.

## Technisch

`src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`, `isEmail`-Zweig in der Schritt-Ansicht: denselben `CopyValue`-Block (`step.login_name`, `step.password`) wie im Nicht-E-Mail-Zweig einfügen. Keine Änderungen an Datenbank oder Serverfunktionen nötig.

## Prüfung

- Typprüfung und Build
- Web.de-Schritt eines beanspruchten Datensatzes zeigt das generierte Passwort
