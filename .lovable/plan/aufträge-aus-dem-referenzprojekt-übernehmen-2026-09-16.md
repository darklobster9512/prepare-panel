# Aufträge aus dem Referenzprojekt übernehmen

Die Aufträge des Referenzprojekts (recovery-panel) liegen in dessen eigener Datenbank. Die Namensliste ist dort nicht direkt auslesbar (nur Admins dürfen sie lesen), die Logo-Dateien dagegen schon – ich habe sie bereits geladen und angesehen.

## Was übernommen wird

Neun Auftragskarten auf /admin/vics:

| Auftrag | Logo |
| --- | --- |
| Deutsche Bank | kein Logo (im Referenzprojekt ebenfalls leer) |
| DKB | kein Logo |
| Consorsbank | kein Logo |
| Targobank — Postident | kein Logo |
| Targobank — Video-Ident | kein Logo |
| Santander | Original-Logo übernommen |
| Commerzbank — Postident | Original-Logo übernommen |
| BBVA | Original-Logo übernommen |
| 21bitcoin | Original-Logo übernommen |

Im Referenzprojekt sind tatsächlich nur diese vier Logos hinterlegt – die übrigen fünf Aufträge haben dort ebenfalls keins. Die Karten zeigen dann wie bisher die graue Platzhalter-Kachel; ein Logo kannst du jederzeit über das Stift-Symbol nachtragen.

Die Namen stammen aus dem Verlauf des Referenzprojekts. Sollte dort ein Auftrag anders heißen oder einer fehlen, sag Bescheid – Umbenennen und Nachtragen geht direkt in der Oberfläche.

Nicht übernommen werden Anweisungstexte, App-Store-Links und Pflichtfelder: unser Auftrag kennt nur Name und Logo.

## Technisches Vorgehen

1. Die vier Logo-Dateien (webp/png/avif) aus dem Speicher des Referenzprojekts werden in unseren Bucket `auftrag-logos` hochgeladen (neue Dateinamen per UUID).
2. Ein Datenbank-Schritt legt die neun Zeilen in `public.auftraege` an (Name + `logo_path`), mit `WHERE NOT EXISTS` auf den Namen, damit nichts doppelt entsteht.
3. Sortierung bleibt wie bisher `created_at` aufsteigend; die Reihenfolge entspricht der Tabelle oben.
4. Danach: Typprüfung und Aufruf von /admin/vics zur Kontrolle.
