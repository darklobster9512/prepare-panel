# Aufräumen: Hinweis-Texte und Platzhalter-Navigation entfernen

## Ziel
Vier sichtbare Reste aus der Mockup-Phase entfernen – keine Logik- oder Datenbankänderungen.

## Änderungen

1. **„Vorschau-Ansicht mit Beispieldaten" entfernen** (Admin- und Mitarbeiter-Seitenleiste)
   - `src/components/panel-shell.tsx`, Zeile 95: Abzeichen/Hinweiszeile komplett löschen. Da beide Seitenleisten dieselbe Komponente nutzen, ist der Hinweis damit überall weg.

2. **„Rolle wird automatisch vergeben" entfernen** (Auth-Seite)
   - `src/routes/auth.tsx`, Zeile 244: `<Trust icon={UserCheck} text="Rolle wird automatisch vergeben" />` löschen; ungenutzte Imports (`UserCheck`, ggf. `Trust`) aufräumen.

3. **„Übersicht", „Termine", „Dokumente" aus der Mitarbeiter-Navigation entfernen**
   - In allen drei Mitarbeiter-Seiten die drei Nav-Einträge löschen, sodass nur noch „Aufträge" übrig bleibt:
     - `src/routes/_authenticated/mitarbeiter.index.tsx` (Zeilen 65–68)
     - `src/routes/_authenticated/mitarbeiter.auftraege.index.tsx` (Zeilen 90–93)
     - `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` (Zeilen 250–253, „Zurück zur Übersicht"-Verweis anpassen auf /mitarbeiter/auftraege)
   - Ungenutzte Icon-Imports (LayoutDashboard, CalendarDays, FileText) entfernen.
   - Da die Übersichtsseite dann keinen Einstiegspunkt mehr hat: `src/routes/_authenticated/mitarbeiter.index.tsx` wird zu einer Umleitung auf `/mitarbeiter/auftraege` (beforeLoad-Redirect). Die bisherige Mockup-Übersichtsseite entfällt damit komplett.

4. **Prüfung**
   - Typprüfung (tsgo) und Build-Log kontrollieren.

## Technik
- Nur Frontend/Präsentation; keine Datenbank, keine Server-Funktionen, keine Rechteänderungen.
- Seitentitel/Meta der betroffenen Seiten bleiben erhalten.
