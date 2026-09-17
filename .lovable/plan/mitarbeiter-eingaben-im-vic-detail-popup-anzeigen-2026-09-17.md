# Mitarbeiter-Eingaben im Vic-Detail-Popup anzeigen

Im Detail-Popup unter /admin/vics werden zusätzlich alle Daten sichtbar, die der Mitarbeiter beim Abarbeiten hinterlegt hat.

## Was neu im Popup steht

**Neuer Abschnitt „E-Mail-Konto"** (zwischen persönlichen Daten und Notizen):
- Erstellte E-Mail-Adresse (die der Mitarbeiter eingetragen hat)
- Die für die Registrierung generierten Daten: Adresse (Straße, PLZ, Ort) und Geburtsdatum
- Wenn nichts hinterlegt ist: Hinweis „Noch keine E-Mail hinterlegt."

**Pro Auftrag in „Zugewiesene Aufträge"** zusätzlich zu Anmeldename/Passwort:
- Status als farbiges Abzeichen (offen / erfolgreich / fehlgeschlagen)
- Verwendeter Anmeldename und verwendetes Passwort (die final eingetragenen Werte, getrennt von den generierten)
- WebID-Link bzw. Postident-Link, jeweils als anklickbarer Link
- Abgeschlossen am (Datum/Uhrzeit), falls vorhanden

Generierte und tatsächlich verwendete Werte stehen untereinander mit klarer Beschriftung („Generiert" / „Verwendet"), damit Abweichungen sofort auffallen. Jeder Wert behält das bestehende Kopier-Symbol.

## Technische Umsetzung

- `src/lib/vic-auftraege.types.ts`: `VicAuftrag` um `used_login_name`, `used_password`, `webid_link`, `postident_link`, `completed_at` erweitern.
- `src/lib/vics.functions.ts`:
  - `SELECT_COLUMNS` um die vier Vic-Felder `email_address, email_street, email_postal_code, email_city, email_birth_date` sowie in `vic_auftraege(...)` um `used_login_name, used_password, webid_link, postident_link, completed_at` ergänzen.
  - `VicRow` um die E-Mail-Felder erweitern, `mapVic` entsprechend durchreichen.
- `src/routes/_authenticated/admin.vics.tsx`: Detail-Dialog um den E-Mail-Abschnitt und die zusätzlichen Zeilen je Auftrag erweitern; `CredentialRow` wiederverwenden, Links über ein kleines Link-Element. Status-Abzeichen über die vorhandenen Helfer aus `src/lib/auftrag-status.ts`.

Keine Datenbank-Änderung nötig — alle Spalten existieren bereits. Die Tabelle selbst und die Rechte bleiben unverändert.
