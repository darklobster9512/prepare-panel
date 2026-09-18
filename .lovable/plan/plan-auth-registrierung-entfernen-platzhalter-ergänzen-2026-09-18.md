# Plan: /auth – Registrierung entfernen, Platzhalter ergänzen

## Änderungen an /auth

1. **Registrierung entfernen**
   - Nur noch der Anmelden-Modus: der Modus-State (signin/signup), beide Umschalt-Links (oben in der Kopfzeile und unter dem Button) und der Registrieren-Zweig in `handleSubmit` fallen weg.
   - `signUpSchema`, der „Noch kein Konto?"-Text, der Hinweis „Mindestens 6 Zeichen." und der Bestätigungs-Hinweis nach dem SignUp entfallen.
   - `autoComplete` am Passwortfeld wechselt auf `current-password`.
   - Kopfzeile: rechts kein Link mehr, nur die Wortmarke.
   - head(): Beschreibung ohne den Registrierungs-Hinweis („Im IdentPanel anmelden.").

2. **Platzhalter in den Eingabefeldern**
   - E-Mail-Feld: `placeholder="name@beispiel.de"`.
   - Passwort-Feld: `placeholder="Ihr Passwort"`.

Alles andere (Anmelde-Logik, Rollen-Weiterleitung, Fehlermeldungen, Layout, Vertrauenshinweise, Footer) bleibt unverändert. Keine Datenbank- oder Server-Änderungen – bestehende Konten melden sich wie bisher an.

## Technisch

- Nur `src/routes/auth.tsx` wird angepasst (Logik vereinfacht + zwei placeholder-Attribute).
- Farb- und Design-Tokens bleiben unverändert.
