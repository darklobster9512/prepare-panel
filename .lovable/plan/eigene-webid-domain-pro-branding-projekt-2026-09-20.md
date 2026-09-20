# Eigene WebID-Domain pro Branding/Projekt

Beim Export soll der WebID-Link automatisch auf die Domain des jeweiligen Brandings umgeschrieben werden.

## Was du bekommst

- In `/admin/projekte` gibt es beim Anlegen und Bearbeiten eines Brandings einen Schalter **„Eigener WebID-Link"**.
- Ist er aktiv, erscheint ein Feld für die Domain, z. B. `webid.codebricks-gmbh.com` (ohne `https://`, wird automatisch ergänzt).
- Beim Export-Button unter `/admin/vics` wird der WebID-Link des Datensatzes auf diese Domain umgeschrieben.

Beispiel Vendis (`webid.vendis-solutions.net`):

```text
vorher:  https://webid-gateway.de/service/index/cn/000347/aid/700483682
nachher: https://webid.vendis-solutions.net/index/cn/000347/aid/700483682
```

Der `/service`-Teil aus dem Standardlink entfällt dabei; alles ab `/index/...` bleibt unverändert. Hat ein Branding keinen eigenen Link aktiviert oder ist dem Datensatz kein Branding zugeordnet, bleibt der Link wie bisher. Postident-Links werden nicht verändert.

## Technische Umsetzung

1. Migration: `ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS webid_domain text;` (NULL = kein eigener Link).
2. `src/lib/projects.functions.ts`: `ProjectRow` um `webid_domain` erweitern, Select ergänzen, `projectSchema` um `webid_domain: z.string().trim().nullable()` (leer → NULL, `https://`/Slashes werden serverseitig entfernt), in `createProject`/`updateProject` mitschreiben.
3. `src/routes/_authenticated/admin.projekte.tsx`: Dialog um `Switch` + `Input` erweitern, State `customWebid`/`webidDomain`, beim Bearbeiten vorbelegen, Wert an die Mutation übergeben; in der Liste die Domain als kleiner Hinweistext anzeigen.
4. `src/lib/vics.functions.ts`: Select auf `projects(name, webid_domain)` erweitern, `VicRow` um `project_webid_domain` ergänzen und in `mapVic` setzen.
5. `src/lib/vic-export.ts`: Helfer `applyWebidDomain(link, domain)` — parst den Link, ersetzt den Host, entfernt ein führendes `/service`-Segment; bei ungültiger URL oder fehlender Domain wird der Originallink verwendet. In `buildExportText` nur auf `item.webid_link` anwenden (Signatur erhält die Domain aus `vic.project_webid_domain`).
6. Typprüfung und Build-Check nach der Umsetzung.
