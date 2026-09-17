# Mitarbeiter bearbeiten (Stift-Symbol)

## Änderung in /admin/mitarbeiter

- Der Button „Onboarding bearbeiten" wird durch ein kleines **Stift-Symbol** in der Aktionen-Spalte ersetzt (Tooltip/Vorlesetext „Mitarbeiter bearbeiten").
- Das Popup heißt jetzt **Mitarbeiter bearbeiten** und enthält:
  - **Neues Passwort** für das Mitarbeiter-Konto (optional, mind. 6 Zeichen, mit Auge-Symbol). Leer lassen = Passwort bleibt unverändert.
  - Schalter **Onboarding aktiv**.
  - **GoLogin E-Mail** und **GoLogin Passwort** (mit Auge-Symbol).
  - Ein „Speichern"-Knopf für alles zusammen, mit deutscher Rückmeldung („Änderungen gespeichert.") bzw. klarer Fehlermeldung.

## Technische Umsetzung

- `src/lib/admin-users.functions.ts`: `updateEmployeeOnboarding` wird zu `updateEmployee` erweitert — zusätzliches, optionales Feld `newPassword` (zod: min. 6 Zeichen, wenn gesetzt). Der Handler prüft weiterhin per `assertAdmin`, speichert die Onboarding-Felder über `context.supabase` und setzt das Passwort — falls angegeben — mit dem im Handler dynamisch importierten Admin-Client (`@/integrations/supabase/client.server`) über `auth.admin.updateUserById(userId, { password })`. Deutsche Fehlermeldungen.
- `src/routes/_authenticated/admin.mitarbeiter.tsx`: Aktionen-Zelle rendert einen Icon-Button (`Pencil`, `variant="ghost"`, `size="icon"`, `aria-label`); Dialog-Titel/Beschreibung angepasst; neues Passwortfeld samt State und Validierung; Mutation ruft `updateEmployee`.
- Keine Datenbank-Änderung nötig.
