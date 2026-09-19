# Countdown-Timer neben dem SMS-Aktualisieren-Icon

## Ziel
Auf `/mitarbeiter/auftraege/$vicId` neben dem Refresh-Icon in der Telefonnummer-Card ein sichtbarer Countdown, der von 5 auf 1 herunterzählt und dann neu lädt (alle 5 Sekunden SMS-Auto-Update, wie vorhanden).

## Umsetzung (nur `src/routes/_authenticated/mitarbeiter.auftraege.$vicId.tsx`)

1. **Countdown-State in `WizardPage`**
   - Neuer State `smsCountdown` (Startwert 5).
   - `useEffect` mit 1-Sekunden-Intervall: Zähler von 5 auf 1 herunterzählen, bei 0 zurück auf 5.
   - Nach jedem erfolgreichen/neuen SMS-Refetch (`smsQuery.dataUpdatedAt`) wird der Zähler auf 5 zurückgesetzt, damit der Countdown synchron zum tatsächlichen Nachladen läuft.

2. **Anzeige in `PhoneCard`**
   - `PhoneCard` erhält zusätzlich das Prop `countdown` (Zahl).
   - Rechts neben dem Refresh-Button erscheint ein kleines Badge, z. B. „5 s“, das sekündlich runterzählt (5…4…3…2…1, dann wieder 5 beim Neuladen).
   - Dezent gestaltet (kleines Pill/Badge im bestehenden Karten-Stil), stört das Layout nicht.

## Verhalten
- Nur sichtbar/aktiv, wenn eine Telefonnummer zugewiesen ist (gleiches `enabled` wie die SMS-Abfrage).
- Manueller Klick auf das Refresh-Icon setzt den Countdown ebenfalls auf 5 zurück.

## Prüfung
- Build/Typprüfung läuft automatisch; danach Zähler im Preview visuell prüfen (Zahl zählt sichtbar herunter).
