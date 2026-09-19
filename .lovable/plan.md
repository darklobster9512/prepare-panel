# VPS: git pull-Konflikt mit package-lock.json lösen

## Problem

Auf dem VPS liegt eine lokal erzeugte `package-lock.json` (von `npm install`), die nicht aus dem Git-Repo stammt. `git pull` bricht ab, weil die Datei überschrieben würde. Folge: Die neuen Code-Änderungen erreichen den Server nie, obwohl alles andere läuft.

## Fix (einmalig auf dem VPS ausführen)

```bash
cd prepare-panel
rm -f package-lock.json
git pull
npm install
npm run build
pm2 restart prepare-panel
```

`rm -f package-lock.json` löscht die lokal erzeugte Datei; `git pull` legt danach die Repo-Version an. Danach funktioniert `git pull` bei zukünftigen Updates ohne diesen Schritt.

## Zukünftiges Update-Verfahren (ab dann immer)

```bash
cd prepare-panel
git pull
npm install
npm run build
pm2 restart prepare-panel
```

## Technischer Hintergrund

- Die Datei ist im Repo eingecheckt; der VPS hatte eine eigene, abweichende Version erzeugt.
- Kein Code-Eingriff im Projekt nötig — reines Server-Aufräumen.
