# Telefonnummern: Seitenfehler beheben + gekaufte Nummer retten

## Was ich geprüft habe
- Dein AnoSIM-Konto: Guthaben 470,00 USD, **eine aktive Nummer ist vorhanden**: `+4917610742550`, gekauft heute 08:15, gültig bis 19.10.2026. Der Kauf hat also geklappt.
- Unsere Datenbanktabelle für Nummern ist **leer** – die gekaufte Nummer wurde bei uns nie gespeichert und deshalb auch dem Datensatz nicht zugewiesen.
- AnoSIM liefert den Preis als Text (`"30.00"`), die Seite rechnet aber mit einer Zahl. Genau daran stürzt `/admin/telefonnummern` ab, sobald mindestens eine Nummer im Konto liegt (vorher war die Liste leer, deshalb fiel es nicht auf).

## Was ich ändere

### 1. Absturz der Seite beheben
Preise und Guthaben werden beim Einlesen sauber in Zahlen umgewandelt, bevor sie angezeigt werden. Fehlt ein Preis oder ist er unbrauchbar, steht dort „–" statt eines Absturzes. Gilt für die Nummernliste, das Detailfenster und das Kauffenster.

### 2. Kauf wird zuverlässig gespeichert
Nach dem Kauf wird die Nummer nicht mehr nur aus der Kaufantwort gelesen (die offenbar anders aufgebaut ist als erwartet), sondern direkt aus der Nummernliste des Kontos nachgeladen: die neueste Buchung, die bei uns noch nicht bekannt ist, wird gespeichert und – wenn der Kauf aus dem Vic-Popup kam – sofort diesem Datensatz zugewiesen. Findet sich nichts, gibt es eine klare Meldung statt eines stillen Erfolgs.

### 3. Bereits gekaufte Nummer nutzbar machen
Im Popup „Aufträge zuweisen" erscheint zusätzlich zum Kauf-Button ein kleiner Bereich „Vorhandene freie Nummer zuweisen", solange es im Konto Nummern ohne Datensatz gibt. Damit kannst du `+4917610742550` direkt dem richtigen Datensatz zuordnen, ohne erneut zu kaufen. Gibt es keine freien Nummern, ist der Bereich unsichtbar.

## Technische Details
- `src/lib/anosim.functions.ts`: `priceInUSD`/`basePrice`/`accountBalanceInUSD` über `Number(...)` mit `Number.isFinite`-Prüfung normalisieren; `AnosimBooking.priceInUSD` als `number | string` typisieren.
- `buyAnosimNumber`: nach dem `POST /Orders` erneut `GET /OrderBookings` abrufen, Buchungen gegen vorhandene `order_booking_id` in `anosim_numbers` abgleichen, neue Buchung(en) upserten (`number`, `end_date`, `vic_id`), Rückgabe der tatsächlich gespeicherten Nummern.
- `src/routes/_authenticated/admin.telefonnummern.tsx`: defensive Formatierung (`formatUsd`-Helfer) statt direkter `.toFixed`-Aufrufe.
- `src/routes/_authenticated/admin.vics.tsx`: `listAssignableNumbers` + `assignNumberToVic` (existieren bereits serverseitig) im Telefonnummer-Bereich wieder anbinden, nur sichtbar wenn freie Nummern vorhanden.
- Danach: Typprüfung und Aufruf von `/admin/telefonnummern` gegen den laufenden Server.
