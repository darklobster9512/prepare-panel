# Web.de-Passwörter: Mindestlänge auf 15 Zeichen

## Hintergrund
Die Mindestlänge für generierte Passwörter (Web.de und alle anderen Aufträge mit Passwort-Generierung, außer BBVA mit festem Muster) ist aktuell 12 Zeichen. Sie wird auf 15 erhöht.

## Änderung
- `src/lib/password.ts`: `generateVicPassword` — Standard-Mindestlänge von 12 auf 15 Zeichen. Bei kurzen Vornamen werden automatisch mehr Ziffern angehängt (z. B. `Lena` → 11 Ziffern statt 8).
- Gilt überall, wo Passwörter erzeugt werden: einzelnes Zuweisen, Sammelzuweisen und „Neu erzeugen" im Admin-Bereich.

## Bestehende Datensätze
- Geprüft: Es gibt **keine** offenen, noch nicht beanspruchten Web.de-Datensätze mit Passwort unter 15 Zeichen — keine nachträgliche Anpassung nötig.
- Beanspruchte und abgeschlossene Datensätze (inkl. Lena Kathrin Bremicker, `Lena21757136`, 12 Zeichen) bleiben unverändert, da die Passwörter dort bereits verwendet wurden.

## Verifikation
- Typprüfung und Build.
