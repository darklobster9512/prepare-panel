# Seitentitel, Beschreibungen, Favicon & Lovable-Hinweise

## Ziel
Einheitliche, gut lesbare Seitentitel und Beschreibungen für alle Seiten, ein eigenes Favicon im Marineblau/Blau-Branding und keine sichtbaren Lovable-Hinweise mehr.

## 1. Titel & Beschreibungen
Einheitliches Schema: `<Seite> – IdentPanel`. Jede Seite bekommt eine eigene, treffende Kurzbeschreibung.

- Startseite: „IdentPanel – Interne Vorbereitung für Unternehmensprozesse"
- Anmelden: „Anmelden – IdentPanel"
- Admin-Übersicht: „Übersicht – Admin-Panel | IdentPanel"
- Vic-Datensätze, Projekte, Mitarbeiter, Telefonnummern: „<Bereich> – Admin-Panel | IdentPanel"
- Mitarbeiter-Übersicht, Aufträge, Auftragsdetail: „<Bereich> – Mitarbeiter-Panel | IdentPanel"

Alle internen Seiten behalten `noindex`; nur Startseite bleibt indexierbar. Beschreibungen und og:-Angaben werden passend zur jeweiligen Seite formuliert.

## 2. Favicon
Neues, quadratisches Markenzeichen im Branding (Marineblau #02193d, Blau #3096ff): schlichtes Monogramm/Schild-Symbol, gut lesbar bei 16 px. Wird als `public/favicon.png` (64×64) abgelegt, im Root als Icon verlinkt; die alte `favicon.ico` wird gelöscht.

## 3. Lovable-Hinweise entfernen
- `author`-Angabe „Lovable" im Seitenkopf entfernen.
- README auf eine kurze, projektbezogene Beschreibung umschreiben (kein Lovable-Text mehr).

Nicht angetastet werden technische Bausteine, die den Betrieb sicherstellen (Build-Konfiguration, Fehlerberichte, Supabase-Anbindung) – diese sind nicht sichtbar, ihre Entfernung würde die App brechen.

## Technische Details
- `head()` in `src/routes/index.tsx`, `src/routes/auth.tsx` und allen Routen unter `src/routes/_authenticated/` aktualisieren (title, description, og:title, og:description; og:type/twitter:card bleiben).
- `src/routes/__root.tsx`: `{ name: "author", content: "Lovable" }` entfernen, Icon-Link auf `/favicon.png` (type `image/png`) umstellen.
- Favicon per Bildgenerierung erzeugen, auf 64×64 skaliert nach `public/favicon.png`, `public/favicon.ico` löschen.
- `README.md` neu schreiben.
- Abschluss: Typprüfung und Build.
