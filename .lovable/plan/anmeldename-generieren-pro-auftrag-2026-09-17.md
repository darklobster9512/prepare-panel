# Anmeldename generieren pro Auftrag

## Was du bekommst

Im Popup „Auftrag hinzufigen / bearbeiten" gibt es neben „Passwort generieren" einen weiteren Schalter **„Anmeldename generieren"**. Aktiviert = aus dem Vic-Datensatz wird automatisch ein Anmeldename gebaut.

**Regel:** Nachname + zweistelliges Geburtsjahr, z. B. `Ehses66`, `Scholze72`, `Steen79`.

**Mindestlänge 8 Zeichen:** Ist Nachname + zweistelliges Jahr kürzer als 8 Zeichen, wird stattdessen das volle vierstellige Jahr verwendet, z. B. `Melz1966`, `Vogt1966`. (Hinweis: Bei zweistelligem Jahr wird nur die letzte Ziffer des Nachnamens weggelassen, wenn er mit einem Namenszusatz endet — „van Steen" wird zu `Steen79`, also letztes Wort des Nachnamens.)

- Bei **DKB** ist der Schalter bereits aktiviert.
- Weitere Aufträge (Web.de, BBVA usw.) stellst du selbst über den Schalter ein.
- Der Schalter ist eine Einstellung pro Auftrag — das sichtbare Ergebnis (der generierte Anmeldename je Vic) kommt in einem spateren Schritt dazu.

## Technische Umsetzung

1. **Datenbank:** `ALTER TABLE public.auftraege ADD COLUMN generate_loginname boolean NOT NULL DEFAULT false;` Danach DKB aktivieren: `UPDATE public.auftraege SET generate_loginname = true WHERE name = 'DKB';`

2. **Generator:** `src/lib/password.ts` um `generateLoginName(vic)` erweitern:
   - Nachname: letztes Wort des Nachnamen-Felds (behondelt „van Steen" → „Steen"), erste letter groß.
   - Geburtsjahr aus `birth_date` (Format JJJJ-MM-TT).
   - Kandidat `Name + JJ`; wenn Länge < 8 → `Name + JJJJ`.
   - Ohne Geburtsdatum oder Nachname: `null`.

3. **Server-Funktionen** (`src/lib/auftraege.functions.ts`): `generate_loginname` in `AuftragRow`, `auftragSchema` und die SELECT-/INSERT-/UPDATE-Anweisungen aufnehmen.

4. **Oberfläche** (`src/components/auftraege-section.tsx`): Neuer Switch „Anmeldename generieren" mit kurzem Erklartext („Nachname + Geburtsjahr, mind. 8 Zeichen") unter dem Passwort-Schalter; Zustand in `form`-State, `openEdit` und `resetForm` mitführen; beim Speichern mitsenden.

## Prüfung

- Typprufung und Build
- /admin/vics liefert 200
- DKB-Karte: Popup zeigt aktivierten Schalter
