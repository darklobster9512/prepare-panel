# E-Mail als dritte Ident-Art

## Was sich ändert

- Im Popup „Auftrag hinzufügen / bearbeiten" gibt es neben Videoident und Postident eine dritte Auswahl: **E-Mail**.
- Auf der Auftragskarte erscheint dann das kleine Label „E-Mail".
- Im Popup „Aufträge zuweisen" werden alle Aufträge mit der Art E-Mail zuerst gelistet – direkt unter der Telefonnummer-Karte, mit einer kleinen Überschrift „E-Mail". Danach folgen die übrigen Aufträge wie bisher.
- Bestehende Aufträge bleiben unverändert; die Art lässt sich jederzeit im Bearbeiten-Popup auf E-Mail umstellen.

## Technisch

- Migration: Die Prüfregel auf `public.auftraege.ident_type` wird ersetzt, sodass zusätzlich `'email'` erlaubt ist.
- `src/lib/auftraege.functions.ts`: `IdentType` um `"email"` erweitern, `auftragSchema` auf `z.enum(["videoident","postident","email"])` anpassen.
- `src/components/auftraege-section.tsx`: `IDENT_LABELS` um `email: "E-Mail"`, Radio-Liste um `"email"` erweitern.
- `src/routes/_authenticated/admin.vics.tsx`: Im Zuweisen-Dialog die Liste aus `auftraegeQuery.data` vor dem Rendern stabil sortieren (E-Mail-Aufträge zuerst, sonst bisherige Reihenfolge) und eine schlichte Zwischenüberschrift über den beiden Gruppen anzeigen. Kein Eingriff in Zuweisungs-Logik oder Zugangsdaten.
