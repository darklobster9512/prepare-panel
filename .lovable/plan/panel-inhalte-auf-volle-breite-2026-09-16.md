# Panel-Inhalte auf volle Breite

## Aktueller Stand
Der Inhaltsbereich aller Panel-Seiten (/admin, /admin/mitarbeiter, /admin/vics, /admin/projekte, /mitarbeiter) ist zentriert und über `max-w-6xl` (ca. 1152 px) in `src/components/panel-shell.tsx` (Zeile 128) begrenzt.

## Änderung
In `src/components/panel-shell.tsx` die Breitenbegrenzung des Inhaltscontainers entfernen: `mx-auto w-full max-w-6xl` → `w-full`.

Damit nutzt der Inhalt die volle Breite neben der Seitenleiste auf allen Panel-Seiten, die PanelShell verwenden. Sonst nichts ändern (Abstände, Tabellen, Karten bleiben wie sie sind).

## Verifikation
- Typprüfung (tsgo) fehlerfrei
- /admin/vics im Browser aufrufen: Inhalt füllt die volle Breite
