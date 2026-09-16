# Landingpage mit Hero-Section im Raisin-Style

## Ziel

Eine Landingpage, die nur aus einer vollen Hero-Section besteht. Sie kündigt ein
internes Panel zur Vorbereitung von Unternehmensprozessen an. Design und
Branding-Farben orientieren sich an https://www.raisin.com/de-de/.

## Analyse der Raisin-Brand (von der Live-Seite extrahiert)

- Dunkles Marineblau (Primär/Text): `#02193d`
- Kräftiges Blau (Akzente, Buttons): `#3096ff`
- Helles Blau (Verläufe, Highlights): `#62afff`
- Cremeweiß (Seitenhintergrund): `#f7f5f3`, Beige `#edebe9`
- Typografie: Raisin nutzt "Basier Square" — als freie, optisch ähnliche
  Grotesk wird **Plus Jakarta Sans** über Google-Fonts-Link geladen.

## Hero-Section (Aufbau wie Raisin)

- Voller Viewport, cremeweißer Hintergrund (`#f7f5f3`)
- Großes Headline-Paar in Marineblau, links ausgerichtet:
  - H1: „Ihr Panel für die interne Vorbereitung von Unternehmensprozessen"
  - Unterzeile: kurzer Satz, dass das Panel in Vorbereitung ist
- Pill-förmiger CTA-Button in `#3096ff` („Zum Panel" — ohne funktionale
  Verlinkung, da das Panel noch entsteht)
- Dezente blaue Akzente/Verlaufs-Elemente (`#3096ff` → `#62afff`) als
  Hintergrund-Detail, kein Bild nötig
- Keine Navigation, kein Footer — nur die Hero

## Technische Umsetzung

- `src/routes/index.tsx`: Platzhalter ersetzen durch die Hero-Section
- `src/styles.css`: Design-Tokens auf Raisin-Farben umstellen (oklch-Werte,
  abgeleitet aus den Hex-Farben; Primary = `#02193d`, Accent/CTA = `#3096ff`,
  Background = `#f7f5f3`)
- `src/routes/__root.tsx`: Plus-Jakarta-Sans-Font per `<link>` laden,
  Titel/Metadaten („Panel – Interne Vorbereitung Unternehmensprozesse")
  setzen, inkl. og- und twitter-Tags
