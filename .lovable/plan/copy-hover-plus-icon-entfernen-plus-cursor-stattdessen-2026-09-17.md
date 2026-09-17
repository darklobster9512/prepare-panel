# Copy-Hover: Plus-Icon entfernen, Plus-Cursor stattdessen

## Ziel
Auf der Mitarbeiter-Detailseite (`/mitarbeiter/auftraege/$vicId`) verschwindet das kleine „+"-Icon, das bisher beim Hovern neben kopierbaren Werten erscheint. Stattdessen zeigt der Mauszeiger über dem Wert ein „+"-Cursor-Symbol. Klick auf den Text kopiert weiterhin, mit kurzem grünen Haken als Bestätigung. Die separaten Kopier-Symbole bleiben unverändert.

## Änderungen

Datei: `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx` — drei Stellen mit identischem Muster:

1. **CopyText** (kleine Inline-Werte): das `Plus`-Icon samt Hover-Einblendung entfernen; nur der grüne `Check` bleibt als Klick-Bestätigung. Button-Klasse um `cursor-copy` ergänzen (CSS `cursor: copy` → Plus-förmiger Mauszeiger).
2. **CopyValue** (Werte in Boxen): gleiches Vorgehen — `Plus`-Icon entfernen, `cursor-copy` ergänzen.
3. **Field** (Vic-Daten-Karte): gleiches Vorgehen — `Plus`-Icon entfernen, `cursor-copy` ergänzen.

Danach: ungenutzten `Plus`-Import entfernen, Typprüfung und Build prüfen.

## Nicht geändert
- Kopier-Symbole (CopyButton) bleiben wie sie sind.
- Klick-zum-Kopieren inkl. grünem Haken bleibt.
- Selbst auszufüllende Felder (Anmeldename, Passwort, WebID-/Postident-Link) bleiben ohne Kopier-Funktion.
