# Plan: /auth-Registrierung vereinfachen

## Änderungen an /auth

1. **Vorname/Nachname entfernen**: Das Registrieren-Formular fragt nur noch E-Mail und Passwort ab. Die zugehörigen Validierungsregeln und Felder werden entfernt. Der Trigger in der Datenbank legt Profile ohne Namen an (Anzeigename fällt auf die E-Mail bzw. „Mitarbeiter:in" zurück).
2. **„Schritt 1 von 1" entfernen**: Die Schritt-Anzeige im Formularkopf wird komplett gestrichen, da es nur einen Schritt gibt.

Keine weiteren Änderungen am Layout oder an den Panels.

## Technisch

- `src/routes/auth.tsx`: Vor-/Nachname-Felder + zod-Regeln entfernen, Schritt-Badge entfernen, signUp ohne Namens-Metadata.
- Datenbank-Trigger `handle_new_user` akzeptiert fehlende Namen bereits (COALESCE), keine Migration nötig.
