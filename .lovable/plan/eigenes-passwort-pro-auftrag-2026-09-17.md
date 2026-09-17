# Eigenes Passwort pro Auftrag

## Aktueller Stand

Beim Zuweisen wird das Passwort pro Zuweisung einzeln erzeugt: für jeden Auftrag laufen die 6 Zufallsziffern neu, es wird nichts vom Vic-Datensatz oder von einem anderen Auftrag übernommen. Zwei Aufträge beim selben Vic bekommen also bereits unterschiedliche Passwörter (z. B. `Stefan856102` und `Stefan204773`). In der Datenbank gibt es aktuell noch keine Zuweisungen, an denen sich das zeigen liesse.

## Was ich zusätzlich absichere

Rein rechnerisch können zwei Zufallszahlen identisch ausfallen (1 zu 1 Million). Damit das ausgeschlossen ist:

- Beim Erzeugen eines Passworts werden die bereits vergebenen Passwörter desselben Vic-Datensatzes geprüft; bei einer Dopplung wird neu gewürfelt (bis zu 10 Versuche).
- Gleiches gilt für „Neu erzeugen": das neue Passwort unterscheidet sich garantiert von den Passwörtern der anderen Aufträge dieses Vics.
- Der Anmeldename bleibt bewusst gleich (Nachname + Geburtsjahr), da er sich aus den Personendaten ableitet.

## Technisch

In `src/lib/vic-auftraege.functions.ts`: `buildCredentials` lädt zusätzlich die vorhandenen `password`-Werte der anderen `vic_auftraege`-Zeilen desselben `vic_id` (beim Neu-Erzeugen ohne die eigene Zeile) und wiederholt `generateVicPassword`, bis der Wert nicht in dieser Menge liegt.
