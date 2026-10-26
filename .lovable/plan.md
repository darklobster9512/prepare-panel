# Share-Link beim Kauf + SMS-Anzeige fuer Mitarbeiter reparieren

## Aktueller Stand (geprueft)
- Share-Links entstehen bisher erst beim Export oder beim Abschluss. Die 4 neuesten Nummern (Sauter, Ripke, Prenzel, Bringezu) sind noch offen und haben deshalb noch keinen Link. Die AnoSIM-Schnittstelle funktioniert.
- Fuer Rudolf Sauter liefert AnoSIM 3 SMS (WEB DE, 17:10–17:14 Uhr). Nummer, Zuordnung und Rechte in der Datenbank stimmen. Das Panel versteckt aber jeden Abruffehler und zeigt dann nur "Noch keine SMS empfangen" – die genaue Ursache auf deinem Server ist daher noch nicht sichtbar.

## 1. Share-Link direkt beim Kauf
- Nach jedem erfolgreichen Nummernkauf (Admin-Kauf, Zuweisung einer freien Nummer, automatischer Kauf ueber die Schnittstelle) wird der Share-Link sofort bei AnoSIM erzeugt und gespeichert.
- Klappt das nicht, bleibt die Nummer zugewiesen; der Link wird beim Export bzw. Abschluss nachgeholt.
- Einmalig fuer alle aktiven, zugewiesenen Nummern ohne Link nachtraeglich erzeugen (u. a. die 4 oben).
- Share-Link im Admin-Detailfenster neben der Telefonnummer kopierbar anzeigen.

## 2. Share-Link bei Abschluss ans externe Panel
- Beim Abschluss wird fuer jeden erfolgreichen Auftrag `anosim_link` mit dem gespeicherten Share-Link uebertragen (Videoident: E-Mail, Identlink, AnoSIM-Link; BBVA: Anmeldename, Passwort, E-Mail, AnoSIM-Link). Ist noch keiner gespeichert, wird er vorher erzeugt.
- Sicherstellen, dass der Link auch dann mitgeht, wenn er beim Kauf schon erzeugt wurde (gespeicherten Wert wiederverwenden, keinen neuen erzeugen).

## 3. SMS-Anzeige reparieren
- SMS-Abruf auf "nie zwischenspeichern" umstellen (POST statt GET), damit hinter deiner Domain keine alte leere Antwort haengen bleibt.
- Abruffehler nicht mehr verschlucken: Die Telefonnummern-Karte zeigt eine klare Fehlermeldung, und der Server schreibt Status/Antwort von AnoSIM ins Log (`pm2 logs prepare-panel`).
- Nach dem Update pruefe ich mit Rudolf Sauters Buchung, dass die 3 SMS ueber die Panel-Funktion zurueckkommen.

## Technische Details
- Gemeinsamer Helfer `ensureShareLink` in `src/lib/anosim-purchase.server.ts`; genutzt von Kaufpfaden, `src/routes/api/public/vics.ts`, `prepare-results.server.ts` und `getVicShareLink`.
- `listVicSms` in `src/lib/mitarbeiter.functions.ts`: POST, Logging, Fehler nur bei AnoSIM-400 als leer werten; `smsQuery.error` in `PhoneCard` anzeigen.
- Danach auf dem Server: `git pull`, `npm install`, `npm run build`, `pm2 restart prepare-panel`.
