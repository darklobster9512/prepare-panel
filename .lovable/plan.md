# BBVA-Passwörter für offene Aufträge anpassen

Alle noch offenen BBVA-Zuweisungen bekommen das neue Passwortmuster **Vorname + 2026** (z. B. `Ramona2026`). Bereits abgeschlossene Zuweisungen bleiben unverändert.

## Betroffene Datensätze (7 offen)

| Vorname | alt | neu |
| --- | --- | --- |
| Ramona | Ramona153845 | Ramona2026 |
| Kevin | Kevin901288 | Kevin2026 |
| Kristina | Kristina915162 | Kristina2026 |
| Soi Julia | Soi339333 | Soi2026 |
| Alexandra | Alexandra084344 | Alexandra2026 |
| Kevin | Kevin366298 | Kevin2026 |
| Nadine | Nadine641608 | Nadine2026 |

Unverändert bleiben die zwei abgeschlossenen BBVA-Einträge (Dominik = fehlgeschlagen, Dominique Sandrine = erfolgreich).

## Technisch

Einmalige Migration: `UPDATE public.vic_auftraege va SET password = split_part(btrim(v.first_name), ' ', 1) || '2026'` über Join auf `auftraege` (`name = 'BBVA'`) und `vics`, eingeschränkt auf `va.status = 'offen'` und `va.completed_at IS NULL`. Keine Code- oder Schemaänderung nötig — die Generierungslogik nutzt das neue Muster bereits.
