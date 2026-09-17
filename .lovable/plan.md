# Mitarbeiter-Panel: Aufträge abarbeiten

## Übersicht /mitarbeiter/auftraege

Neuer Reiter „Aufträge" in der Seitenleiste des Mitarbeiter-Panels.

- Pro Vic-Datensatz **eine Karte** (nicht pro Auftrag), sobald dem Datensatz mindestens ein Auftrag zugewiesen ist.
- Karte zeigt: Name, Geburtsdatum, Geburtsort, Telefonnummer (falls vorhanden) und die Logos aller zugewiesenen Aufträge mit Status-Outline.
- **Kein Projekt** – das bleibt nur für Admins sichtbar.
- Drei Bereiche: „Verfügbar" (unbeansprucht), „Meine Aufträge" (von mir beansprucht), „Erledigt" (alle Aufträge bearbeitet).
- Button **„Beanspruchen"** auf freien Karten: der ganze Datensatz wird dem Mitarbeiter zugewiesen und öffnet die Detailseite. Ein bereits beanspruchter Datensatz lässt sich von anderen nicht mehr übernehmen.

## Detailseite (Wizard) /mitarbeiter/auftraege/$vicId

Kopfbereich, immer sichtbar:

- Vic-Daten (Name, Geburtsdatum, Geburtsort, Adresse, Familienstand, Steuer-ID, Bank) – ohne Projekt.
- Telefonnummer mit Gültigkeit und Kopieren-Symbol.
- **Alle eingehenden SMS** dieser Nummer, mit Aktualisieren-Knopf.
- Die eingetragene E-Mail-Adresse (sobald vorhanden).

Darunter der Wizard: ein Step pro zugewiesenem Auftrag, Reihenfolge nach der Sortier-Nummer des Auftrags. Eine Fortschrittsleiste mit den Logos zeigt alle Steps und deren Status.

Jeder Step zeigt: Logo + Name, Ident-Art, generierten Anmeldenamen und Passwort (kopierbar), Knopf **„INFOS"** (öffnet Besonderheiten + hochgeladene Screenshots des Auftrags) und die Knöpfe **„Erfolgreich"** / **„Fehlgeschlagen"**. Nach dem Markieren geht es zum nächsten Step – auch bei „Fehlgeschlagen".

### Step 1 – E-Mail-Auftrag

- Hinweisbox: für das E-Mail-Konto **nicht** die echten Vic-Daten verwenden, nur den echten Namen.
- Angezeigt werden: echter Vor-/Nachname + **generierte Fantasiedaten**: eine echte deutsche Adresse (Straße, PLZ, Ort aus einer hinterlegten Liste realer deutscher Adressen) und ein zufälliges Geburtsdatum – nur das Geburtsjahr stimmt mit dem Vic überein.
- Diese Daten werden einmalig erzeugt und gespeichert, damit sie bei jedem Aufruf gleich bleiben.
- Eingabefeld: die tatsächlich registrierte E-Mail-Adresse. Sie wird gespeichert und danach in jedem Bank-Step oben angezeigt.

### Bank-Steps (Abschlussfelder je Auftrag)

| Auftrag | Eingabefelder am Ende |
| --- | --- |
| DKB | Anmeldename (vorausgefüllt), Passwort (vorausgefüllt), WebID-Link |
| Deutsche Bank | WebID-Link |
| BBVA | Anmeldename (vorausgefüllt), Passwort (vorausgefüllt) |
| Targobank — Video-Ident | WebID-Link |
| Commerzbank, Targobank — Postident, Consorsbank | Postident-Link |
| Sonstige | keine Zusatzfelder |

## Admin-Seite

- `/admin/vics`, Spalte „Aufträge": jedes Logo bekommt eine farbige Umrandung – grau = unbearbeitet, blau = beansprucht, grün = erfolgreich, rot = fehlgeschlagen. Tooltip nennt Auftrag und Status.
- Im Auftrags-Popup (`/admin/vics`) neues Feld **„Reihenfolge"** (Zahl), das die Wizard-Reihenfolge steuert. Voreingestellt: E-Mail 10, DKB 20, Deutsche Bank 30, BBVA 40, Consorsbank 50, Commerzbank 60, Targobank 70, Santander 80.

## Technische Umsetzung

**Migration**

- `auftraege`: `sort_order integer NOT NULL DEFAULT 100`; Startwerte für die acht bekannten Aufträge setzen (E-Mail-Aufträge über `ident_type = 'email'`).
- `vics`: `claimed_by uuid REFERENCES auth.users ON DELETE SET NULL`, `claimed_at timestamptz`, plus generierte E-Mail-Identität: `email_street`, `email_postal_code`, `email_city`, `email_birth_date date`, `email_address text`.
- `vic_auftraege`: `status text NOT NULL DEFAULT 'offen' CHECK (status IN ('offen','erfolgreich','fehlgeschlagen'))`, `used_login_name`, `used_password`, `webid_link`, `postident_link`, `completed_at`, `completed_by`.
- Neue RLS-Policies für Mitarbeiter: `auftraege` SELECT für alle `authenticated`; `vics` SELECT für `authenticated`; `vic_auftraege` SELECT für `authenticated`, UPDATE nur wenn der Datensatz von diesem Nutzer beansprucht wurde; `vics` UPDATE (Beanspruchen/E-Mail-Felder) nur solange `claimed_by IS NULL` oder `claimed_by = auth.uid()`; `anosim_numbers` SELECT für `authenticated`. Admin-Policies bleiben bestehen.

**Server-Funktionen** – neue Datei `src/lib/mitarbeiter.functions.ts`, alle mit `requireSupabaseAuth` und über `context.supabase` (RLS greift):

- `listWorkItems` – Vics mit mindestens einer Auftragszuweisung, inkl. Telefonnummer, Aufträgen (Status, Zugangsdaten, Logo, Sortierung) und Claim-Info. Projekt wird bewusst nicht selektiert.
- `getWorkItem(vicId)` – Detaildaten inkl. Besonderheiten/Bilder der Aufträge.
- `claimVic(vicId)` – setzt `claimed_by`/`claimed_at`, schlägt fehl wenn bereits beansprucht.
- `saveEmailIdentity(vicId)` – erzeugt beim ersten Aufruf Adresse + Geburtsdatum (Jahr vom Vic) aus einer Liste echter deutscher Adressen in `src/lib/fake-identity.ts` und speichert sie.
- `saveEmailAddress(vicId, email)`.
- `completeAuftrag({ vic_id, auftrag_id, status, used_login_name?, used_password?, webid_link?, postident_link? })` – zod-validiert, nur für den beanspruchenden Mitarbeiter.
- `listVicSms(vicId)` – liest die `order_booking_id` der zugewiesenen Nummer und ruft die bestehende AnoSIM-SMS-Abfrage auf (Rollenprüfung: Admin **oder** beanspruchender Mitarbeiter); dazu wird die vorhandene `assertAdmin`-Prüfung in `anosim.functions.ts` für diesen Fall ergänzt.

**Frontend**

- `src/routes/_authenticated/mitarbeiter.auftraege.tsx` – Kartenübersicht mit Bereichen, React Query + Mutations.
- `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` – Wizard, Kopfbereich, SMS-Liste, INFOS-Dialog (Besonderheiten + Bilder über signierte URLs wie `AuftragLogo`).
- `mitarbeiter.tsx` und die Admin-Seiten: Seitenleisten-Eintrag „Aufträge" → `/mitarbeiter/auftraege`.
- `src/lib/vics.functions.ts`: `VicAuftrag` um `status` erweitern; `admin.vics.tsx` rendert die Status-Umrandung.
- `src/components/auftraege-section.tsx` + `auftraege.functions.ts`: Feld `sort_order`.
- Alle Farben über bestehende Design-Tokens, Meldungen deutsch und inline, Panel-Seiten mit `noindex`.
