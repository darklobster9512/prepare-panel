# Plan: Reiter „Projekte" im Admin-Panel (/admin/projekte)

## Ziel

Neuer Reiter **Projekte** in der Seitenleiste des Admin-Panels, unter `/admin/projekte`. Dort kannst du Projekte anlegen – im Popup gibt es genau **ein Eingabefeld: Projektname** (z. B. „LIMEX"). Alle Projekte werden in einer Tabelle angezeigt. Zugriff nur für Admins.

## Seite

- Seitenleiste im Admin-Panel bekommt den Eintrag **„Projekte"** → `/admin/projekte` (unter „Vics").
- Die Seite zeigt eine Tabelle aller Projekte: **Projektname** und **Anlagedatum**.
- Button **„Projekt hinzufügen"** öffnet ein Popup mit einem einzigen Feld: **Projektname** (Pflichtfeld).
- **Bearbeiten** und **Löschen** je Zeile: Bearbeiten öffnet dasselbe eine Feld mit dem vorhandenen Namen; Löschen fragt vorher zur Bestätigung.
- **Suche** über den Projektnamen.
- Deutsche Rückmeldungen bei Erfolg und Fehlern; die Liste aktualisiert sich nach jeder Änderung selbst.
- Optik: gleicher Raisin-Stil wie Vics und Mitarbeiter – helle Karten, feine Linien, blaue Buttons.

## Technik

- **Datenbank (Migration):** neue Tabelle `public.projects` mit den Feldern: Name, angelegt von, Zeitstempel. Zugriffsregeln wie bei den Vics: nur Admins können Projekte sehen, anlegen, bearbeiten und löschen; kein Zugriff für Mitarbeiter oder nicht angemeldete Besucher.
- **Server-Funktionen** (neue Datei `src/lib/projects.functions.ts`): Auflisten, Anlegen, Umbenennen, Löschen – alle mit Admin-Prüfung auf dem Server (gleiches Muster wie bei Vics).
- **Route** `src/routes/_authenticated/admin.projekte.tsx` (Pfad `/admin/projekte`), noindex.
- Seitenleisten-Einträge in den bestehenden Admin-Seiten um „Projekte" ergänzt.
- Nicht-Admins werden auf ihr Mitarbeiter-Panel geleitet; der Server blockt den Zugriff zusätzlich.

## Bewusst nicht enthalten

- Keine Verknüpfung von Vics zu Projekten (kann später ergänzt werden, wenn gewünscht).
- Keine weiteren Felder außer dem Projektnamen.
