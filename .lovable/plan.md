# Verwendetes Passwort im E-Mail-Auftrag (z. B. Web.de)

## Was sich ändert
- Im E-Mail-Schritt auf der Auftragsseite des Mitarbeiters erscheint unter „Generiertes Passwort" ein neues Eingabefeld **„Verwendetes Passwort"**.
- Es ist mit dem generierten Passwort vorausgefüllt (oder mit einem bereits gespeicherten abweichenden Passwort).
- Ändert der Mitarbeiter das Passwort, wird es beim Klick auf „Erfolgreich"/„Fehlgeschlagen" gespeichert – genau wie bei den anderen Aufträgen.
- Das Feld erscheint nur, wenn für den Auftrag ein Passwort generiert wird.
- Der Export im Admin-Bereich nutzt künftig das verwendete Passwort, falls vorhanden, sonst das generierte.

## Technische Details
- `mitarbeiter.auftraege.$vicId.tsx`: im `isEmail`-Block ein `Field` „Verwendetes Passwort" (State `password`, schon mit `used_password ?? password` vorbelegt), nur wenn `step.password`. In `completeMutation` `used_password` senden, wenn `config.credentials || (isEmail && step.password)`.
- Server (`completeAuftrag`) akzeptiert `used_password` bereits – keine Datenbank-Änderung.
- `vic-export.ts`: E-Mail-Passwort als `used_password ?? password`; dafür `used_password` in `listVics`/`VicAuftrag` mitladen, falls noch nicht vorhanden.
