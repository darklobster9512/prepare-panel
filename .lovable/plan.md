# SMS werden im Mitarbeiter-Panel nicht angezeigt

## Was geprueft wurde (bestaetigt)
- Rudolf Sauter hat die Nummer +4917616172096, korrekt gespeichert und seinem Datensatz zugeordnet (Buchungs-ID 12143015, gueltig bis 25.11.2026).
- AnoSIM liefert fuer genau diese Buchung aktuell 3 SMS (WEB DE, 17:10, 17:13, 17:14 Uhr). Der API-Schluessel funktioniert, mehrere Abrufe hintereinander werden nicht gedrosselt.
- Datenbank-Rechte (Mitarbeiter duerfen Nummer und Datensatz lesen) sind in Ordnung.

Die SMS kommen also bei AnoSIM an, und die gespeicherten Daten stimmen. Der Fehler liegt zwischen deinem Server und dem Mitarbeiter-Bildschirm. Die genaue Ursache ist noch nicht bestaetigt: Das Panel zeigt bei einem Abruffehler nur "Noch keine SMS empfangen" und versteckt die Fehlermeldung. Deshalb ist von aussen nicht sichtbar, was schiefgeht.

## Plan
1. **Fehler sichtbar machen**: Schlaegt der SMS-Abruf fehl, zeigt die Telefonnummern-Karte eine klare Meldung (z. B. "SMS konnten nicht geladen werden: ...") statt "Noch keine SMS". So sieht der Mitarbeiter und du sofort die echte Ursache.
2. **Zwischenspeichern ausschliessen**: Der SMS-Abruf ist aktuell ein GET mit immer gleicher Adresse. Hinter einer Domain/einem Proxy kann dadurch eine alte, leere Antwort haengen bleiben. Abruf wird auf "nie zwischenspeichern" umgestellt (POST bzw. no-store), damit jeder 5-Sekunden-Abruf frisch ist.
3. **Serverseitig protokollieren**: Bei Abruffehlern wird Status und Antwort von AnoSIM ins Server-Log geschrieben (`pm2 logs prepare-panel`), damit sich ein Fehler auf deinem Server nachvollziehen laesst.
4. **Nummer/Buchung robuster lesen**: Fehlt die Buchungs-ID, wird sie ueber die Nummer bei AnoSIM nachgeschlagen, statt still keine SMS zu zeigen.

## Technische Details
- `src/lib/mitarbeiter.functions.ts` (`listVicSms`): Fehler nicht mehr zu `[]` verschlucken ausser bei AnoSIM-400; Logging; Methode auf POST.
- `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`: `smsQuery.error` in `PhoneCard` anzeigen.
- Danach auf dem Server: `git pull`, `npm install`, `npm run build`, `pm2 restart prepare-panel`.

## Bitte vorab pruefen (hilft, die Ursache zu bestaetigen)
- Oeffne bei Rudolf Sauter als Mitarbeiter die Seite und schau, ob die Nummer selbst links erscheint und ob der Countdown (5 s) laeuft. Falls die Nummer fehlt, liegt es am Laden des Datensatzes, nicht an den SMS.
