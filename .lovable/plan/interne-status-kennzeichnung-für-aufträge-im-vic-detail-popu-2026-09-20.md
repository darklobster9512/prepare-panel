# Interne Status-Kennzeichnung für Aufträge im Vic-Detail-Popup

Im Detail-Popup unter `/admin/vics` bekommt jede zugewiesene Auftrags-Card neben dem Export-Button drei Buttons für eine **rein interne Kennzeichnung**. Diese ist unabhängig vom bestehenden Auftragsstatus (Unbearbeitet / Erfolgreich / Fehlgeschlagen) — der bleibt komplett unverändert und wird weiterhin vom Mitarbeiter-Panel gesetzt.

## Die drei neuen Kennzeichnungen

| Button | Interner Wert | Outline im Admin-Bereich |
|---|---|---|
| Gestartet | `gestartet` | Lila |
| Erledigt | `erledigt` | Rainbow (animierter Regenbogen-Ring) |
| Abgesprungen | `abgesprungen` | Schwarz/Weiß gestreift (abwechselnd schwarz-weiß-schwarz-weiß umlaufend) |

- Klick auf einen bereits aktiven Button hebt die Kennzeichnung wieder auf (zurück auf „keine“).
- Ohne Kennzeichnung bleibt alles exakt wie heute.
- Sichtbar nur im Adminbereich (`/admin/vics`): in der Auftrags-Card im Detail-Popup und am Mini-Logo in der Vics-Tabelle. Mitarbeiter sehen davon nichts.

## Änderungen

1. **Migration**: neue Spalte
   `ALTER TABLE public.vic_auftraege ADD COLUMN IF NOT EXISTS internal_mark text;`
   plus CHECK-Constraint auf `('gestartet','erledigt','abgesprungen')` oder NULL. Der bestehende `status`-Constraint wird nicht angefasst. Keine neuen Tabellen, also keine zusätzlichen GRANTs nötig.

2. **`src/lib/vic-auftraege.types.ts`**: `VicAuftrag` um `internal_mark: InternalMark | null` erweitern; Typ `InternalMark = "gestartet" | "erledigt" | "abgesprungen"`.

3. **`src/lib/vics.functions.ts`** und **`src/lib/vic-auftraege.functions.ts`**: `internal_mark` in die SELECT-Spalten und in `mapVic`/`mapRow` aufnehmen.

4. **Neue Server-Function `setVicAuftragInternalMark`** in `src/lib/vic-auftraege.functions.ts`: Admin-Check wie bei `assignAuftrag`, Zod-Input `{ id: uuid, mark: enum | null }`, schreibt `internal_mark`. Kein Einfluss auf `status` oder `completed_at`.

5. **Neue Datei `src/lib/internal-mark.ts`**: Labels und Ring-Klassen-Helfer `internalMarkRingClass(mark)`, damit Popup und Tabelle dieselbe Darstellung nutzen. `statusRingClass` bleibt unverändert; wenn eine Kennzeichnung gesetzt ist, überschreibt deren Ring im Adminbereich den Status-Ring.

6. **`src/styles.css`**: zwei Utility-Klassen
   - `.mark-ring-rainbow` — umlaufender Regenbogen-Ring per `conic-gradient` + Border-Mask, langsam rotierend.
   - `.mark-ring-stripes` — umlaufender Ring mit abwechselnd schwarzen und weißen Segmenten (`repeating-conic-gradient`), ebenfalls per Border-Mask, dezent rotierend.
   Beides ohne hardcodierte Farb-Utilities in Komponenten.

7. **`src/routes/_authenticated/admin.vics.tsx`**:
   - Im Card-Kopf rechts neben dem Export-Button drei kompakte Pill-Buttons „Gestartet“, „Erledigt“, „Abgesprungen“; der aktive ist gefüllt hervorgehoben.
   - `useMutation` auf `setVicAuftragInternalMark`, danach `invalidateQueries(["admin", "vics"])`, Fehler als Toast.
   - Die Card selbst erhält bei gesetzter Kennzeichnung die entsprechende Outline (lila / Rainbow / Schwarz-Weiß-Streifen).
   - Die Mini-Logos in der Vics-Tabelle nutzen bei gesetzter Kennzeichnung ebenfalls diesen Ring statt des Status-Rings.

## Technische Details

- Mitarbeiter-Ansichten (`mitarbeiter.auftraege.*`) werden nicht verändert; `internal_mark` wird dort weder geladen noch angezeigt.
- Export-Button-Logik (`item.completed_at`) bleibt unverändert.
