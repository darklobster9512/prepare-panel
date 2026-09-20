# Export-Button im Vic-Detail-Popup (/admin/vics)

## Ziel
Jede Auftrags-Card im Detail-Popup bekommt (nur bei abgeschlossenen Aufträgen) einen „Export"-Button. Klick öffnet ein Popup mit einem vorausgefüllten Textfeld im gewünschten Format; Text ist editierbar und per Kopier-Button in die Zwischenablage kopierbar.

## Export-Format (Beispiel Deutsche Bank)

```text
=== Jacqueline Van Steen ===
12:30 Uhr (LIMEX)
Vorname: Jacqueline
Nachname: van Steen
Geburtsdatum: 03.07.1979
Geburtsort: Köln
Am Keltersberg 9
53783 Eitorf
Familienstand: geschieden
Steuer-ID: 63051299484
Aktuelle Bank: N26

jacqueline.van.steen@web.de
Jacqueline4362324

Deutsche Bank
Nummer: +4917616146868
https://webid-gateway.de/service/qa/cn/000347/aid/698256862
https://anosim.net/share/orderbooking?token=a9272e5f9eb14205
```

## Datenquellen
- Kopfzeile: Vorname + Nachname, jedes Wort großgeschrieben („van Steen" → „Van Steen").
- Zeile 2: Inhalt des Notizen-Felds des Datensatzes (wird im „Bearbeiten"-Popup gepflegt), unverändert übernommen; leer → Zeile entfällt.
- Identitätsblock: Vorname, Nachname, Geburtsdatum (TT.MM.JJJJ), Geburtsort, Straße, PLZ + Ort, Familienstand, Steuer-ID, Aktuelle Bank – jeweils aus dem Vic; fehlende Werte als „–".
- E-Mail-Block: `email_address` des Vics + das generierte Passwort des E-Mail-Auftrags (Vic-Auftrag mit `ident_type 'email'`, dessen `password`); fehlt beides → „–"-Platzhalter.
- Auftragsblock: Name der Karte (z. B. „Deutsche Bank"), Telefonnummer der zugewiesenen AnoSIM-Nummer („Nummer: …"), WebID-Link des Auftrags, AnoSIM-Share-Link.
- Fehlende Werte (Nummer, Links): Platzhalter „–", damit das Format gleich bleibt.
- Postident-Link: falls kein WebID-Link, aber ein Postident-Link existiert, wird dieser statt des WebID-Links ausgegeben.

## AnoSIM-Share-Link
- Neue Spalte `share_link` (text) an `anosim_numbers` (Migration, bestehende Rechte bleiben).
- Neuer Server-Function-Aufruf `getVicShareLink(vicId)` (in `anosim.functions.ts`): Wenn `share_link` gespeichert ist, diesen zurückgeben. Sonst per AnoSIM-API `POST /OrderBookingShare/{order_booking_id}` erzeugen, `weblink` in der DB speichern und zurückgeben. Wichtig: AnoSIM invalidiert bei jedem Aufruf den alten Token – deshalb wird der Link genau einmal erzeugt und danach immer der gespeicherte benutzt.
- `listVics` lädt künftig auch `order_booking_id` und `share_link` aus `anosim_numbers` mit.

## Umsetzung
1. Migration: `ALTER TABLE public.anosim_numbers ADD COLUMN share_link text;`
2. `src/lib/anosim.server.ts` / `anosim.functions.ts`: Share-Link-Logik wie oben.
3. `src/lib/vics.functions.ts`: SELECT um `order_booking_id`, `share_link` erweitern; `VicRow` um `phone_share_link` ergänzen.
4. Neu `src/lib/vic-export.ts`: reine Funktion `buildExportText(vic, item, emailPassword)` nach obigem Format.
5. `src/routes/_authenticated/admin.vics.tsx`: Export-Button pro Card (nur wenn `completed_at` gesetzt bzw. Status „erfolgreich", auch bei 21bitcoin-Karten ohne internes Passwort im Text), Dialog mit `Textarea` (vorausgefüllt, editierbar) + „Kopieren"-Button.

## Verifikation
- Typprüfung, `/admin/vics` lädt, Export-Popup zeigt formatierten Text; Share-Link wird nach dem ersten Öffnen in der DB gespeichert und beim zweiten Export unverändert wiederverwendet.
