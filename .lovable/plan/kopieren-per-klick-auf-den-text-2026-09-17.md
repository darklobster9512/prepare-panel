# Kopieren per Klick auf den Text

## Ziel

Auf der Mitarbeiter-Detailseite (`/mitarbeiter/auftraege/$vicId`) kopiert ein Klick direkt auf den Wert selbst den Inhalt ins Clipboard. Statt des dauerhaft sichtbaren Kopier-Symbols erscheint beim Hover ein kleines **+**-Symbol neben dem Text; nach dem Klick bestätigt kurz ein Haken, dass kopiert wurde.

## Betroffene Datei

Nur `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` (keine Datenbank- oder Server-Änderungen).

## Umsetzung

1. **Neues Muster statt `CopyButton`** (lokale Komponente, Zeile 103): Der Wert selbst wird ein klickbarer Button (`<button>`, Tastatur-bedienbar, sichtbarer Fokus-Ring). Beim Hover erscheint ein `Plus`-Icon (aus lucide-react, klein `h-3 w-3`, gedimmt) neben dem Text; beim Klick wird kopiert und für ca. 1,5 s ein grüner `Check` angezeigt.
2. **VicCard (Vic-Datensatz-Card, Zeilen 288–334):** Das separate Kopier-Symbol am Zeilenende entfällt. Stattdessen ist der Wert selbst klickbar – nur bei den bisher kopierbaren Feldern (Vorname(n), Nachname, Geburtsname, Geburtsdatum, Geburtsort, Straße, PLZ, Ort) und nur wenn ein Wert vorhanden ist. Familienstand und Steuer-ID bleiben ohne Kopier-Funktion.
3. **`Readonly`-Felder (Zeilen 787–805),** z. B. generierte Adresse im E-Mail-Schritt: Wert im Rahmenfeld wird klickbar (Hover: +, Klick: kopieren + Haken). Kein separates Icon mehr am rechten Rand; der `pr`-Platzhalter entfällt.
4. **`CopyValue`-Felder (Zeilen 125–148),** z. B. „Erstellte E-Mail", „Nummer", „Generierter Anmeldename", „Generiertes Passwort": Gleicher Hover-+-Stil statt des dauerhaft sichtbaren Kopier-Symbols – Klick auf den Text kopiert.
5. **Eingabefelder (`Field`) bleiben unverändert:** Bei selbst auszufüllenden Feldern (verwendeter Anmeldename, verwendetes Passwort, WebID-/Postident-Link) gibt es weiterhin keine Kopier-Funktion – ein Klick dort dient der Texteingabe, nicht dem Kopieren.
6. **Aufräumen:** `CopyButton` wird entfernt, falls danach unbenutzt; `Plus` wird in die lucide-react-Imports aufgenommen, nicht mehr benötigte Icons (z. B. `Copy`) werden entfernt, falls sonst unbenutzt.
7. **Nicht betroffen:** Die Admin-Seite `/admin/telefonnummern` behält ihre eigenen, bisherigen Kopier-Buttons (eigene Kopie der Komponente, unabhängige Datei).

## Verifikation

- Typprüfung/Build fehlerfrei.
- Playwright-Kurzcheck der Detailseite: Hover zeigt + am Wert, Klick kopiert (Clipboard-Ausgabe prüfen), Haken erscheint kurz; Familienstand/Steuer-ID und die Eingabefelder sind nicht klick-kopierbar.
