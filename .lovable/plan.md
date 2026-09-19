# BBVA: Passwort als Vorname + Jahr

## Verhalten

Wird einem Datensatz der Auftrag **BBVA** zugewiesen (oder dessen Zugangsdaten neu erzeugt), lautet das generierte Passwort künftig **Vorname + laufendes Jahr**, z. B. `Dominik2026`.

- Es wird der erste Vorname verwendet, ohne Leer- und Sonderzeichen.
- Das Jahr ist das aktuelle Kalenderjahr (2026, im Januar 2027 dann 2027).
- Gilt nur für BBVA; alle anderen Aufträge mit „Passwort generieren" behalten das bisherige Muster (Vorname + 6 Zufallsziffern).
- Achtung: Das interne Muster für 21bitcoin bleibt `Vorname + Jahr + !` — BBVA bekommt kein Ausrufezeichen.

## Technische Umsetzung

1. **src/lib/password.ts:** neue Funktion `generateYearPassword(firstName)` → erster Vorname (bereinigt) + `new Date().getFullYear()`, ohne `!`.
2. **src/lib/vic-auftraege.functions.ts:** in `buildCredentials` wird der Auftragsname mitgeladen (`select("name, generate_password, generate_loginname, admin_only")`). Ist der Name `BBVA` und `generate_password` aktiv, wird `generateYearPassword` verwendet und die Zufallsziffern-Schleife übersprungen. Da das Muster fest ist, entfällt für BBVA auch die Doppel-Prüfung — das Passwort ist je Vic ohnehin gleich aufgebaut.
3. Greift automatisch in allen drei Wegen: einzelnes Zuweisen, Sammelzuweisung und „Neu erzeugen".

## Prüfung

- Typprüfung und Build
- BBVA einem Test-Datensatz zuweisen → Passwort im Muster `Vorname2026`
