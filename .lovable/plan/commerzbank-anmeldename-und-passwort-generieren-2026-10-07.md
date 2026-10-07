# Commerzbank: Anmeldename und Passwort generieren

## Was du bekommst

- Beim Commerzbank-Auftrag sind „Anmeldename generieren" und „Passwort generieren" aktiviert.
- **Anmeldename:** Nachname + Geburtsjahr wie bei DKB (z. B. `Ehses66`, `Melz1966`) — enthält immer Buchstaben und Zahlen, ist mindestens 8 und höchstens 50 Zeichen lang.
- **Passwort:** Vorname + Ziffern, mindestens 12 und höchstens 45 Zeichen (liegt im erlaubten Bereich 8–45).
- Alle bereits zugewiesenen, noch **offenen** Commerzbank-Aufträge bekommen sofort generierte Zugangsdaten; abgeschlossene bleiben unverändert.
- Im Mitarbeiter-Panel zeigt der Commerzbank-Schritt die generierten Daten und darunter die Felder „Verwendeter Anmeldename" und „Verwendetes Passwort", vorausgefüllt mit den generierten Werten — zusätzlich zum bisherigen Postident-Link.

## Technische Details

- Datenbank: `UPDATE auftraege SET generate_loginname = true, generate_password = true WHERE name = 'Commerzbank';` Danach für offene `vic_auftraege` dieses Auftrags `login_name`/`password` per Generator nachtragen (einmalig, nur `status = 'offen'`).
- `src/lib/password.ts`: `generateLoginName` auf max. 50 Zeichen kürzen (Jahr bleibt erhalten); `generateVicPassword` um optionale Maximallänge ergänzen, für Commerzbank 45.
- `mitarbeiter.auftraege.$vicId.tsx`: Commerzbank in der Schritt-Konfiguration auf `credentials: true, postident: true` setzen — die vorhandenen vorausgefüllten Felder für verwendete Daten werden damit angezeigt und beim Abschließen gespeichert.
- Prüfung: Typprüfung, Build, Abfrage der aktualisierten Commerzbank-Zeilen.
