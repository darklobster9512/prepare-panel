# Generierte Daten im Vic-Detail-Popup anzeigen

## Ziel
Im Detail-Popup unter `/admin/vics` sollen bei Aufträgen mit generierten Zugangsdaten (z. B. Commerzbank) der generierte Anmeldename und das generierte Passwort angezeigt werden, wenn der Mitarbeiter keine verwendeten Daten eingetragen hat.

## Aktuelles Verhalten
Der Abschnitt „Verwendet" pro Auftrags-Card zeigt nur `used_login_name` / `used_password`. Sind beide leer (und kein WebID-/Postident-Link vorhanden), erscheint nur „Noch keine verwendeten Daten." — die generierten Daten (`login_name` / `password`) bleiben unsichtbar, obwohl sie gespeichert sind.

## Änderung (nur `src/routes/_authenticated/admin.vics.tsx`)
- Pro Auftrags-Card (außer `admin_only`, das bleibt wie bisher unter „Intern generiert"):
  - `effectiveLogin = item.used_login_name ?? item.login_name`
  - `effectivePassword = item.used_password ?? item.password`
- Anzeige-Bedingung des Abschnitts um die Fallback-Werte erweitern.
  - Enthält der Wert den Fallback (kein `used_*` vorhanden), wird das Feld als „Anmeldename (generiert)" / „Passwort (generiert)" beschriftet, damit klar ist, dass der Mitarbeiter es nicht bestätigt hat.
  - Wurden verwendete Daten eingetragen, bleibt alles wie heute (Beschriftung ohne Zusatz).
- „Noch keine verwendeten Daten." erscheint nur noch, wenn weder verwendete noch generierte Daten und keine Links existieren.
- Kein Datenbank- oder Server-Change: `login_name`/`password` sind bereits in `VicAuftrag` geladen.

## Betroffene Aufträge
Commerzbank (neuer Anmeldename + Passwort) und alle anderen Aufträge mit aktivierter Generierung (z. B. DKB, E-Mail/Web.de) — überall gilt: verwendete Daten haben Vorrang, sonst generierte.

## Verifikation
- Typprüfung und Build.
- `/admin/vics` antwortet mit HTTP 200.
