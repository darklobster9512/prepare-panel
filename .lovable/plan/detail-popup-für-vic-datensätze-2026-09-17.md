# Detail-Popup für Vic-Datensätze

Ein Klick auf eine Zeile in der Vic-Tabelle öffnet ein Fenster mit allen Angaben zu diesem Datensatz.

## Inhalt des Fensters

- Kopf: Vor- und Nachname, darunter das Projekt (falls zugewiesen).
- Abschnitt "Persönliche Daten": Geburtsname, Geburtsdatum, Geburtsort, Straße, PLZ, Ort, Familienstand, Steuer-ID, Bank, Anlagedatum. Leere Angaben werden als "–" gezeigt.
- Abschnitt "Notizen", nur wenn vorhanden.
- Abschnitt "Zugewiesene Aufträge": pro Auftrag eine Zeile mit Logo und Name. Wenn Anmeldename oder Passwort hinterlegt sind, stehen sie darunter mit je einem Kopier-Symbol. Sind keine Zugangsdaten vorhanden, steht dort ein kurzer Hinweis. Ohne Zuweisungen: "Noch keine Aufträge zugewiesen."
- Unten zwei Schaltflächen: "Bearbeiten" (öffnet das bestehende Bearbeiten-Popup) und "Aufträge zuweisen" (öffnet das bestehende Zuweisen-Popup).

## Bedienung

- Klick irgendwo in der Zeile öffnet die Detailansicht.
- Klicks auf das Projekt-Auswahlfeld und auf die Schaltflächen in der Spalte "Aktionen" öffnen die Detailansicht nicht (sie behalten ihr bisheriges Verhalten).
- Schließen über das X oder Klick außerhalb.

## Technisch

- `src/routes/_authenticated/admin.vics.tsx`: neuer State `detailVicId`; `<tr>` bekommt `onClick`, `role="button"`, `tabIndex`, Tastaturbedienung (Enter/Leertaste) und Hover-Hintergrund. In der Projekt-Zelle und der Aktionen-Zelle `onClick={(e) => e.stopPropagation()}`.
- Neuer `<Dialog>` (max-w-2xl, scrollbar) analog zu den bestehenden Dialogen, gespeist aus `vics.find(v => v.id === detailVicId)`, damit Cache-Updates sofort durchschlagen.
- Zugangsdaten aus `vic.auftraege` (`login_name`, `password`), Logos über `AuftragLogo`; Kopieren über `navigator.clipboard.writeText` mit kurzer Inline-Bestätigung.
- Keine Änderungen an Datenbank oder Server-Funktionen.
