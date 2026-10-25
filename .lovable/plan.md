# E-Mail bei der Rückmeldung: immer die Web.de-Adresse

## Stand
Als `email` wird schon heute die Adresse gesendet, die der Mitarbeiter beim Web.de-Auftrag unter „Erstellte E-Mail“ eingibt. Das ist dieselbe Adresse wie im Export.

## Änderung
- Hat der Mitarbeiter keine Adresse eingegeben, wird sie aus dem Anmeldenamen des Web.de-Auftrags gebildet: der verwendete Name, sonst der generierte, mit „@web.de“ dahinter, falls dort noch kein @ steht.
- Die Adresse steht dann gleich bei jedem Bankauftrag, der eine E-Mail mitschickt (Videoident und BBVA).

## Technische Details
- `src/lib/prepare-results.server.ts`: Den Web.de-Eintrag in `vic_auftraege` über `normalizeBank(name) === "webde"` bzw. `ident_type === "email"` finden. Die E-Mail wird nach dieser Reihenfolge bestimmt: `email_address`, dann `used_login_name`, dann `login_name` (mit `@web.de` ergänzt). Danach `email: webdeEmail` für alle Einträge setzen.
