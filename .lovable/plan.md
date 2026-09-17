# Generierte Zugangsdaten im Vic-Detail-Popup entfernen

## Ziel
Im Detail-Popup eines Vic-Datensatzes unter `/admin/vics` werden keine generierten Zugangsdaten mehr angezeigt – nur noch die final vom Mitarbeiter verwendeten Daten.

## Änderung (nur `src/routes/_authenticated/admin.vics.tsx`)
- Sektion **„Generiert"** (generierter Anmeldename + generiertes Passwort je Auftrag) im Detail-Popup entfernen (Zeilen ~1189–1203).
- Sektion **„Verwendet"** bleibt: verwendeter Anmeldename, verwendetes Passwort, WebID-Link, Postident-Link – inkl. „Abgeschlossen am".
- Abschnitt **„E-Mail-Konto"** bleibt unverändert (Erstellte E-Mail, generierte Adresse, Geburtsdatum).
- Fallback, wenn ein Auftrag noch keine verwendeten Daten hat: Hinweis „Noch keine verwendeten Daten." statt „Keine Zugangsdaten hinterlegt."
- Keine Datenbank-, Server-Funktions- oder Rechte-Änderung.

## Prüfung
Typprüfung (`bunx tsgo --noEmit`) und Build prüfen; Detail-Popup zeigt danach nur Verwendetes.
