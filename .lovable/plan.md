# Schnittstelle: Aufträge zu vorhandenen Vics hinzufügen

## Ziel
Wird ein Datensatz geschickt, den es schon gibt, legt die Schnittstelle keinen zweiten Vic an. Sie hängt die neuen Bankaufträge an den vorhandenen Vic an, genau wie beim Hinzufügen eines Auftrags im Admin.

## Wann gilt ein Datensatz als vorhanden?
Wenn Vorname(n), Nachname und Geburtsdatum übereinstimmen. Groß- und Kleinschreibung und Leerzeichen spielen dabei keine Rolle.

## Was bei einem vorhandenen Vic passiert
- Die Vic-Daten bleiben unverändert und werden nicht überschrieben.
- Neue Aufträge werden hinzugefügt, mit generierten Passwörtern und Anmeldenamen.
- Aufträge, die der Vic schon hat, werden übersprungen. Das gilt auch für Web.de, es entsteht also kein zweiter Web.de-Auftrag.
- Der Vic bleibt beim Mitarbeiter, der ihn bearbeitet hat. War er schon abgeschlossen, wird er wieder geöffnet, wie im Admin.
- Es wird keine neue Nummer gekauft, wenn der Vic schon eine hat. Hat er noch keine, wird eine gekauft.
- Die Telegram-Nachricht geht nur raus, wenn wirklich neue Aufträge dazugekommen sind.

## Antwort
Pro Datensatz kommt zusätzlich `"existing": true` oder `false` zurück. `auftraege` nennt nur die neu hinzugefügten Aufträge. `skipped` nennt die Aufträge, die schon vorhanden waren.

## Technische Details
- `src/routes/api/public/vics.ts`: vor dem Speichern per `supabaseAdmin` nach dem Vic mit gleichem `birth_date` suchen und Vor- und Nachnamen normalisiert vergleichen. Kommen im selben Aufruf zwei gleiche Datensätze, wird der zweite wie ein vorhandener behandelt.
- Vorhandene `vic_auftraege.auftrag_id` laden und doppelte herausfiltern. `vics.completed_at`/`completed_by` auf null setzen, wenn etwas hinzugefügt wurde (wie in `assignAuftrag`).
- Nummernkauf nur, wenn `anosim_numbers` für den Vic leer ist.
- Reine Vergleichslogik als `isSameVic` in `src/lib/auftrag-match.ts` mit Test. Keine Datenbankänderung.
