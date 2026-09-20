# Export: /service/-Segment im WebID-Link beibehalten

Beim Export-Button unter `/admin/vics` wird der WebID-Link aktuell beim Umschreiben auf eine Branding-Domain um `/service/` gekürzt. Künftig bleibt der Pfad exakt wie im Originallink – es wird nur die Domain ersetzt.

Beispiel Vendis (`webid.vendis-solutions.net`):

```text
bisher:  https://webid.vendis-solutions.net/index/cn/000347/aid/700483682
künftig: https://webid.vendis-solutions.net/service/index/cn/000347/aid/700483682
```

Datensätze ohne Branding bzw. ohne aktivierten eigenen WebID-Link bleiben unverändert. Postident-Links werden weiterhin nicht angefasst.

## Technische Umsetzung

1. `src/lib/vic-export.ts`: In `applyWebidDomain` die Zeile `url.pathname.replace(/^\/service(?=\/|$)/i, "")` entfernen – der Host wird ersetzt, `pathname`/`search`/`hash` bleiben 1:1 erhalten.
2. Hinweistext im Dialog unter `/admin/projekte` prüfen und ggf. anpassen, falls dort „ohne /service" erwähnt wird.
3. Typprüfung und Build-Check.
