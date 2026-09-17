# „Noch keine verwendeten Daten." bei internen Aufträgen ausblenden

## Ziel
Im Vic-Detail-Popup (/admin/vics) erscheint bei internen Aufträgen (21bitcoin) kein leeres „Noch keine verwendeten Daten." mehr — dort wird nur das lila „Intern generiert"-Passwort gezeigt.

## Änderung
`src/routes/_authenticated/admin.vics.tsx` (Zeilen ~1179–1213):

Der Else-Zweig, der „Noch keine verwendeten Daten." ausgibt, wird um `!item.admin_only` ergänzt — der Hinweis erscheint nur noch bei normalen Aufträgen:

```tsx
) : !item.admin_only ? (
  <p className="mt-3 border-t border-border/60 pt-3 text-muted-foreground">
    Noch keine verwendeten Daten.
  </p>
) : null}
```

Keine Datenbank-, Server- oder Rechte-Änderung.

## Abschluss
Typprüfung (`bunx tsgo --noEmit`) und Build prüfen.
