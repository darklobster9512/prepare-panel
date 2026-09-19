# Telefonnummer: drei Kopier-Formate

## Ziel
In der Telefonnummer-Karte des Mitarbeiter-Panels (`/mitarbeiter/auftraege/$vicId`) kann die Nummer bisher nur im Format `+49176...` kopiert werden. Verschiedene Banken verlangen unterschiedliche Formate — es gibt künftig drei kopierbare Felder:

1. **International:** `+4917610742550` (bisheriges Format, wie gehabt)
2. **Mit führender 0:** `017610742550` (`+49` wird durch `0` ersetzt)
3. **Ohne Ländercode:** `17610742550` (`+49` entfällt komplett)

## Änderung

Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` — in `PhoneCard` (Zweig `item.phone_number`) die drei Varianten untereinander als `CopyValue`-Felder mit Label anzeigen, z. B. „International", „Mit 0", „Ohne +49". Die Umformung geschieht lokal aus `item.phone_number`:

```text
ohne "+" und Ziffern:   raw = nummer.replace(/^\+49/, "")
Mit 0:                  "0" + raw
Ohne +49:               raw
```

Falls die Nummer nicht mit `+49` beginnt, wird sie unverändert als „Ohne +49"-Variante übernommen (und das Mit-0-Feld entsprechend mit führender 0 aufgebaut). Anzeige der drei Felder nur, wenn eine Telefonnummer zugewiesen ist.

## Nicht geändert
- SMS-Bereich, Countdown und Aktualisieren-Icon bleiben wie sie sind.
- Kopier-Symbole (CopyButton) an anderen Stellen bleiben unverändert.
