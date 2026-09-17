# Sidebar im Mitarbeiter-Panel fixieren

## Ziel
Beim Scrollen einer Seite im Mitarbeiter-Panel bleibt die linke Seitenleiste stehen; nur der Inhalt scrollt.

## Umsetzung (nur Frontend, eine Datei)

`src/components/panel-shell.tsx` – das `<aside>` (Seitenleiste) wird statt im Seitenfluss mitzuscrollen am oberen Rand fixiert:

- Klasse am `<aside>` ergänzen: `lg:sticky lg:top-0 lg:h-screen lg:self-start lg:overflow-y-auto`
- `self-start` ist nötig, damit die Leiste im Flex-Container nicht auf die volle Seitenhöhe gestreckt wird (sonst greift Sticky nicht).
- `overflow-y-auto` sorgt dafür, dass bei sehr vielen Menüpunkten auch innerhalb der Leiste gescrollt werden kann.
- Mobile (< lg) bleibt alles wie gehabt (Leiste dort ausgeblendet).

## Hinweis
`PanelShell` wird von beiden Panels genutzt (Admin + Mitarbeiter). Die Fixierung gilt damit einheitlich für beide Seitenleisten – optisch und funktional konsistent. Keine Datenbank-, Server- oder Rechte-Änderungen.

## Verifizierung
- Typprüfung (`bunx tsgo --noEmit`) und Build fehlerfrei.
- Playwright-Check: Seite mit langem Inhalt öffnen, scrollen, Screenshot – Sidebar bleibt an Position 0.
