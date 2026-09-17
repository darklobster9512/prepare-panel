# Telefonnummern über AnoSIM (/admin/telefonnummern)

Neuer Reiter im Admin-Panel, der direkt mit deinem AnoSIM-Konto spricht.

## Was du bekommst

- **Guthaben** oben als Kachel (Kontostand in USD), jederzeit aktualisierbar.
- **Nummern-Übersicht**: alle Nummern deines AnoSIM-Kontos in einer Tabelle:
  Nummer, Land, Typ (z. B. FullService), Start, Ablauf, Restlaufzeit
  ("noch 12 Tage"), Status (Aktiv/Beendet), Preis.
- **Klick auf eine Zeile**: Detailfenster mit allen Infos zur Nummer und den
  zuletzt empfangenen SMS (Absender, Zeit, Text) – mit Kopier-Symbol für Nummer
  und SMS-Text sowie einem Aktualisieren-Knopf für neue SMS.
- **Nummer kaufen**: ein Knopf "Nummer kaufen". Im Popup wird fest
  Deutschland · FullService · 30 Tage gebucht; angezeigt werden Preis und
  Verfügbarkeit, dazu ein Bestätigen-Knopf. Nach dem Kauf erscheint die Nummer
  sofort in der Tabelle und das Guthaben wird neu geladen.
- **Eigene Notiz je Nummer**: freies Notizfeld, das bei uns gespeichert wird und
  auch nach Ablauf der Nummer erhalten bleibt (Grundlage, um Nummern später
  Vic-Datensätzen zuzuordnen).
- Zugriff nur für Administratoren, deutsche Meldungen, Seite nicht indexierbar.

## Voraussetzung

Ich brauche deinen AnoSIM-API-Schlüssel. Ich frage ihn nach Freigabe dieses
Plans über das sichere Formular ab (Name: `ANOSIM_API_KEY`); er wird nur
serverseitig verwendet und nie an den Browser gegeben.

## Technische Umsetzung

**Secret**: `ANOSIM_API_KEY`, ausschließlich in Server-Funktionen gelesen
(`process.env['ANOSIM_API_KEY']` innerhalb des Handlers).

**API-Client** `src/lib/anosim.server.ts`: Basis `https://anosim.net/api/v1`,
Authentifizierung per Header `Authorization: Bearer <key>`, kleiner
`anosimFetch(path, params, init)`-Helfer mit Fehlerbehandlung (deutsche
Meldung bei 401/Netzwerkfehler).

**Server-Funktionen** `src/lib/anosim.functions.ts`, alle mit
`.middleware([requireSupabaseAuth])` + bestehendem `assertAdmin`-Muster:
- `getAnosimBalance` → `GET /Balance`
- `listAnosimNumbers` → `GET /OrderBookings` (max. 100, enthält Nummer, Land,
  rentalType, Start-/Enddatum, Dauer, Preis, Status); zusätzlich
  `GET /SimCards` für die aktuell gebuchten Karten, gemerged über die Nummer.
  Ergebnis wird mit den eigenen Notizen aus der DB zusammengeführt.
- `listAnosimSms` (Eingabe `orderBookingId`) → `GET /Sms/:orderbookingId`
- `getAnosimFullServiceProduct` → `GET /ProductPrices?countryId=98`, Filter auf
  `rentalType === 'RentalFull'` und `durationInMinutes === 43200` (30 Tage);
  liefert Produkt-Id, Basispreis und verfügbare Anzahl.
- `buyAnosimNumber` → `POST /Orders?productId=<ermittelt>&amount=1&providerId=0`;
  gibt die neue Buchung zurück. Land/Typ/Dauer sind fest verdrahtet, keine
  Auswahl in der Oberfläche.
- `setAnosimNote` → speichert die Notiz in der eigenen Tabelle (Upsert).

**Migration**: Tabelle `public.anosim_numbers`
(`id uuid pk`, `order_booking_id bigint unique not null`, `number text`,
`note text`, `created_by uuid references auth.users on delete set null`,
`created_at`, `updated_at` + `update_updated_at_column`-Trigger);
GRANTs für `authenticated` und `service_role`; RLS an, alle Policies über
`has_role(auth.uid(),'admin')`, kein `anon`-Zugriff.

**Route** `src/routes/_authenticated/admin.telefonnummern.tsx`
(Pfad `/admin/telefonnummern`), `head()` mit noindex, React Query
(`["admin","anosim","numbers"]`, `["admin","anosim","balance"]`, SMS pro
Buchung), Mutationen für Kauf und Notiz mit `invalidateQueries`,
Detail-Dialog analog zum Vic-Detailfenster, Inline-Meldungen (kein Toaster),
clientseitige Umleitung zu `/mitarbeiter`, wenn die Rolle nicht `admin` ist.

**Seitenleiste**: Eintrag "Telefonnummern" (Icon `Phone`) in allen
Admin-Seiten (`admin.index.tsx`, `admin.mitarbeiter.tsx`, `admin.vics.tsx`,
`admin.projekte.tsx`) ergänzen.

Verlängern von Nummern ist bewusst nicht enthalten.
