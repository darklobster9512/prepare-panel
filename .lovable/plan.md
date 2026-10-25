# Schnittstelle erweitern: Nummer kaufen und Aufträge zuweisen

## Ziel
Sobald dein externes Panel einen Datensatz schickt, passiert automatisch:
1. Der Vic wird angelegt (wie bisher).
2. Eine neue AnoSIM-Nummer (Deutschland, Full Service, 30 Tage) wird gekauft und dem Vic zugewiesen.
3. Web.de wird immer zugewiesen, auch wenn es nicht genannt wird.
4. Alle mitgeschickten Aufträge werden zugewiesen, inklusive generierter Passwörter und Anmeldenamen wie beim Zuweisen im Admin.
5. Die Telegram-Benachrichtigung für neue Aufträge geht raus wie beim Zuweisen im Admin.

## Neues Feld: `auftraege`
Eine Liste im Format `Bank-identart`:
```text
"auftraege": ["Commerzbank-videoident", "DKB-videoident", "DeutscheBank-videoident", "Consorsbank-postident", "Santander-postident"]
```
- Die Bank wird mit den Auftragsvorlagen abgeglichen. Groß- und Kleinschreibung, Leerzeichen und Zusätze werden ignoriert, z. B. „DeutscheBank" = „Deutsche Bank" und „Targobank" = „Targobank — Video-Ident".
- Gibt es für eine Bank mehrere Vorlagen mit verschiedener Ident-Art, wird die passende genommen.
- Die Ident-Art (videoident/postident) ist Pflicht im Format. Gibt es pro Bank nur eine Vorlage, wird diese zugewiesen, auch wenn deren hinterlegte Ident-Art abweicht (z. B. Santander ist als Videoident angelegt).
- 21bitcoin (nur intern) kann nicht über die Schnittstelle zugewiesen werden.
- Unbekannte Bank oder falsches Format: Der ganze Datensatz wird abgelehnt, bevor etwas gespeichert oder gekauft wird.

## Antwort
Bei Erfolg kommt pro Datensatz zurück: Vic-ID, gekaufte Nummer und die zugewiesenen Aufträge.
Klappt der Nummernkauf nicht (z. B. kein Guthaben oder keine Nummer verfügbar), bleiben Vic und Aufträge gespeichert. Die Antwort meldet dann „Nummer konnte nicht gekauft werden“ und du kannst im Admin von Hand eine Nummer zuweisen.

## Grenzen
- Wegen der Nummernkäufe nur noch bis zu 20 Datensätze pro Aufruf statt 200.
- Jeder Aufruf kauft echte Nummern mit deinem AnoSIM-Guthaben. Da die Adresse öffentlich ist, kann jeder mit der Adresse Käufe auslösen. Ich empfehle weiterhin, die Adresse geheim zu halten.

## Technische Details
- Kauflogik aus `buyAnosimNumber` und Produktsuche aus `getAnosimFullServiceProduct` in einen gemeinsamen Server-Helfer `src/lib/anosim-purchase.server.ts` auslagern (Supabase-Client als Parameter). Die bestehende Admin-Funktion nutzt ihn weiter, die Schnittstelle nutzt ihn mit dem Admin-Client.
- Zugangsdaten-Erzeugung (`buildCredentials`) und Telegram-Versand in `src/lib/vic-auftraege.server.ts` auslagern; `assignAuftrag`/`assignAuftraegeBulk` rufen sie weiter auf.
- `src/routes/api/public/vics.ts`: erst alle Datensätze prüfen (inkl. Auftragsabgleich), dann pro Datensatz: Vic anlegen, Aufträge mit Web.de zuerst einfügen (`created_by = null`), Nummer kaufen, Telegram senden.
- Keine Datenbank-Änderung nötig.
- Test: Prüfung mit falschem Format und unbekannter Bank (ohne Kauf). Einen echten Kauf teste ich nicht automatisch, da er Guthaben kostet. Den ersten echten Aufruf machst du.
