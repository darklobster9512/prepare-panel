# Admin-Reiter „Einstellungen“: Automatischer Nummernkauf

## Ziel
Ein neuer Reiter „Einstellungen“ im Admin-Panel. Dort steuerst du, was mit übertragenen Datensätzen passiert. Als erste Einstellung kannst du den automatischen Nummernkauf ein- und ausschalten. Standardmäßig ist er eingeschaltet.

## Verhalten
- Neuer Reiter „Einstellungen“ unter `/admin/einstellungen`, in der Seitenleiste aller Admin-Seiten.
- Abschnitt „Übertragene Datensätze“ mit dem Schalter „Nummer automatisch kaufen“ und kurzer Erklärung. Eine Änderung wird sofort gespeichert und kurz bestätigt.
- Eingeschaltet: Es läuft alles wie bisher.
- Ausgeschaltet: Beim Übertragen wird keine Nummer gekauft. Vic und Aufträge werden trotzdem angelegt, und die Telegram-Nachricht geht raus. Die Antwort enthält dann `number: null` und `number_skipped: true`. Eine Nummer weist du danach im Admin von Hand zu.
- Nur Admins können die Einstellungen sehen und ändern.

## Technische Details
- Migration: Tabelle `app_settings`. Sie hat genau eine Zeile mit `auto_buy_number boolean default true` und `updated_at`. Die Zeile wird gleich mit angelegt. Grants gehen an `authenticated` und `service_role`, RLS ist aktiv, und nur Admins (`has_role`) dürfen lesen und ändern.
- `src/lib/settings.functions.ts`: `getSettings` und `updateSettings` mit Admin-Prüfung.
- Neue Seite `src/routes/_authenticated/admin.einstellungen.tsx` mit einem Schalter. Den Nav-Eintrag ergänze ich überall dort, wo die anderen Admin-Reiter aufgeführt sind.
- `src/routes/api/public/vics.ts` liest die Einstellung einmal pro Aufruf mit dem Admin-Zugang. Fehlt die Zeile, gilt „eingeschaltet“. Ist der Kauf aus, wird er übersprungen.
