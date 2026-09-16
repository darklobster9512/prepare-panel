# Plan: Projekt-Zuordnung in der Vics-Tabelle

## Ziel

In der Vics-Tabelle (/admin/vics) kommt nach der Spalte „Bank" eine neue Spalte **„Projekt"**. Dort weist du jedem Datensatz schnell eines der angelegten Projekte (aus /admin/projekte, z. B. LIMEX) zu.

## Umsetzung

- **Neue Tabellen-Spalte „Projekt"** nach „Bank": pro Zeile ein kleines Auswahlfeld (Dropdown) direkt in der Tabelle – Klick, Projekt wählen, fertig. Kein Popup nötig. Über denselben Weg lässt sich die Zuordnung auch wieder entfernen („Kein Projekt").
- **Im Vic-Formular** (Anlegen/Bearbeiten) gibt es zusätzlich ein Auswahlfeld „Projekt" mit allen vorhandenen Projekten.
- **Suche** berücksichtigt auch den Projektnamen.
- Änderungen werden sofort gespeichert und die Ansicht aktualisiert sich selbst.
- Optik unverändert im Raisin-Stil.

## Technik

- **Datenbank (Migration):** Die Vics-Tabelle bekommt ein neues Feld `project_id`, das auf ein Projekt verweist. Wird ein Projekt gelöscht, bleiben die Datensätze erhalten – die Zuordnung wird dann einfach entfernt (kein Datenverlust bei Vics). Zugriffsregeln bleiben unverändert (nur Admins).
- **Server-Funktionen** (`src/lib/vics.functions.ts`): Beim Laden der Vics wird der Projektname gleich mitgeliefert; neue Funktion `assignVicProject` zum schnellen Zuweisen/Entfernen; `createVic`/`updateVic` nehmen das Projekt-Feld mit.
- **Seite** `admin.vics.tsx`: neue Spalte mit Dropdown je Zeile, Auswahlfeld im Formular, Suche erweitert.
- Der Schnell-Import bleibt unverändert (kein Projekt-Feld im Import).

## Hinweis

Bestehende Datensätze starten ohne Projekt-Zuordnung – du kannst sie dann per Dropdown zuweisen.
