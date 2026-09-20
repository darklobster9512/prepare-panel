# Vics-Detail-Popup breiter machen

Das Detail-Popup eines Datensatzes unter `/admin/vics` wird in der Horizontale verbreitert, damit mehr Inhalt nebeneinander passt.

## Änderungen

- Datei: `src/routes/_authenticated/admin.vics.tsx` (Detail-Dialog, Zeile 1208)
- Breite des Dialogs von `sm:max-w-2xl` (672 px) auf `sm:max-w-3xl lg:max-w-5xl` (bis 1024 px) erhöhen.
- Block „Persönliche Daten" bei breiten Screenshots dreispaltig (`lg:grid-cols-3`) statt zweispaltig, damit die Liste kürzer wird.
- Abschnitte E-Mail-Konto und Telefonnummer bei großen Breiten nebeneinander (`lg:grid-cols-2`) statt untereinander.
- Keine Datenbank- oder Server-Änderung; nur Layout im Popup.

## Ergebnis

Das Detail-Popup nutzt die Bildschirmbreite besser, Inhalt steht nebeneinander und der vertikale Scroll-Anteil sinkt. Auf Mobilgeräten bleibt alles einspaltig wie bisher.
