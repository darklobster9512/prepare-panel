# Status-Buttons für Aufträge im Vic-Detail-Popup

Im Detail-Popup unter `/admin/vics` bekommt jede zugewiesene Auftrags-Card neben dem Export-Button drei kleine Buttons, mit denen der Auftragsstatus direkt gesetzt wird. Die farbige Umrandung (Outline) der Card/des Logos ändert sich je nach Status.

## Status-Mapping

| Button | DB-Status | Outline |
|---|---|---|
| Gestartet | `gestartet` (neu) | Lila |
| Erledigt | `erfolgreich` | Rainbow (animierter Regenbogen-Ring) |
| Abgesprungen | `fehlgeschlagen` | Schwarz/weiß (grauer Ring, monochrom) |

- „Erledigt“ setzt zusätzlich `completed_at = now()` (falls leer) → Export-Button erscheint.
- „Abgesprungen“ setzt ebenfalls `completed_at = now()` (falls leer).
- „Gestartet“ leert `completed_at` wieder.
- Nicht gesetzte Fälle bleiben wie bisher: `offen` ohne Beanspruchung = grau, beansprucht = blau, 21bitcoin = lila.

## Änderungen

1. **Migration** (`supabase/migrations/`): CHECK-Constraint `vic_auftraege_status_check` droppen und neu anlegen mit `('offen','gestartet','erfolgreich','fehlgeschlagen')`. Keine Tabellen-/GRANT-Änderungen (Spalten bleiben gleich).

2. **`src/lib/mitarbeiter.types.ts`**: `AuftragStatus` um `"gestartet"` erweitern.

3. **`src/lib/auftrag-status.ts`**:
   - `STATUS_LABELS`: `gestartet: "Gestartet"`, `fehlgeschlagen: "Abgesprungen"` (Label nur im Admin-Kontext umbenannt, DB-Wert bleibt).
   - `statusRingClass`: `gestartet` → `ring-2 ring-purple-500`; `erfolgreich` → Rainbow-Ring-Klasse; `fehlgeschlagen` → Schwarz/Weiß-Ring-Klasse (grau/monochrom statt rot). Gilt automatisch auch für die Mini-Logos in der Vic-Liste und im Mitarbeiter-Panel (gleiche Funktion), damit die Farbsprache überall konsistent ist.

4. **Rainbow- & Schwarz/Weiß-Ring in `src/styles.css`**: zwei Utility-Klassen (z. B. `.status-ring-rainbow`, `.status-ring-mono`), die per `::before` mit `conic-gradient` + Mask-Technik einen 2-px-Ring um das runde Element legen; der Rainbow-Ring rotiert langsam (CSS-Animation mit `@property --angle`-Fallback). Kein Tailwind-Arb. von hardcoded Utility-Farben in Komponenten.

5. **Neue Server-Function `setVicAuftragStatus`** in `src/lib/vic-auftraege.functions.ts`: Admin-Check (wie `assignAuftrag`), Zod-Input `{ id: uuid, status: enum }`, schreibt `status` + `completed_at` auf `vic_auftraege`.

6. **`src/routes/_authenticated/admin.vics.tsx`** (Detail-Popup, Auftrags-Card):
   - Daneben (rechts vom Export-Button bzw. im selben Kopf-Row) drei kompakte Pill-Buttons „Gestartet“, „Erledigt“, „Abgesprungen“.
   - Der gerade aktive Status ist visuell hervorgehoben (gefüllt), die anderen als Outline-Pills.
   - `useMutation` auf `setVicAuftragStatus`, danach `queryClient.invalidateQueries({ queryKey: ["admin", "vics"] })` und Toast bei Fehler.
   - Der Status-Badge im Card-Kopf bekommt ein eigenes Styling für `gestartet` (lila, analog 21bitcoin) und zeigt das Label „Abgesprungen“ für `fehlgeschlagen`.

## Technische Details

- Der Rainbow-Ring ersetzt das bisherige grüne `ring-emerald-500` überall dort, wo `statusRingClass` benutzt wird — auch im Mitarbeiter-Panel. Das ist gewollt, damit „Erledigt“ überall am Rainbow-Ring erkennbar ist.
- Export-Button-Logik (`item.completed_at`) bleibt unverändert; durch die Buttons erscheint er nach „Erledigt“/„Abgesprungen“ automatisch.
