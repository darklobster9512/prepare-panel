# Interne Aufträge (21bitcoin)

Aufträge können künftig als **intern** markiert werden. Interne Aufträge sind nur für Admins sichtbar, erledigen sich beim Zuweisen selbst und bekommen ein eigenes Passwortmuster sowie eine lila Umrandung.

## Verhalten

- **Neue Einstellung im Auftrags-Popup:** Schalter „Nur intern (Admin)". Für 21bitcoin wird sie direkt aktiviert.
- **Passwort:** Bei internen Aufträgen wird immer ein Passwort nach dem Muster `Vorname` + Jahr + `!` erzeugt (z. B. Stefan2026!, Olaf2026!, Jacqueline2026!). Verwendet wird das laufende Kalenderjahr. Der normale Schalter „Passwort generieren" (Vorname + 6 Ziffern) greift hier nicht, ebenso kein Anmeldename.
- **Automatisch erledigt:** Beim Zuweisen wird der Auftrag sofort als erfolgreich gespeichert, inkl. Abschlusszeitpunkt. Niemand muss ihn abarbeiten.
- **Lila Umrandung:** In der Aufträge-Spalte und im Detail-Popup bekommt das Logo eines internen Auftrags immer eine lila Umrandung und das Abzeichen „Intern" — unabhängig vom Status.
- **Für Mitarbeiter unsichtbar:** Interne Aufträge tauchen weder in den Karten unter „Aufträge" noch als Wizard-Schritt auf. Datensätze, die nur interne Aufträge haben, erscheinen gar nicht im Mitarbeiter-Panel. Der Abschluss-Schritt wird durch interne Aufträge nicht blockiert.

## Technische Umsetzung

- **Migration:** `auftraege.admin_only boolean not null default false`; anschließend `UPDATE` auf den Auftrag „21bitcoin".
- **src/lib/password.ts:** neue Funktion `generateInternalPassword(firstName)` → erster Vorname (ohne Sonderzeichen) + aktuelles Jahr + `!`.
- **src/lib/auftraege.functions.ts:** `admin_only` in `AuftragRow`, `auftragSchema` und allen SELECTs.
- **src/components/auftraege-section.tsx:** Switch „Nur intern (Admin)" im Dialog, Wert wird mitgespeichert; bei aktivem Schalter Hinweistext zum Passwortmuster.
- **src/lib/vic-auftraege.functions.ts:** `buildCredentials` lädt zusätzlich `admin_only`; ist es gesetzt → `password = generateInternalPassword(...)`, `login_name = null`. `assignAuftrag` setzt bei internen Aufträgen direkt `status = 'erfolgreich'`, `completed_at = now()`, `completed_by = userId`. `admin_only` wird über den Join in `VicAuftrag` mitgeliefert (`src/lib/vic-auftraege.types.ts`).
- **src/lib/vics.functions.ts:** `auftraege(admin_only)` in `SELECT_COLUMNS` und `mapVic`.
- **src/lib/auftrag-status.ts:** `statusRingClass(status, claimed, adminOnly?)` → bei `adminOnly` immer `ring-2 ring-purple-500`; `statusLabel` gibt „Intern" zurück.
- **src/lib/mitarbeiter.functions.ts:** in `listWorkItems`/`getWorkItem` interne Aufträge aus `auftraege` herausfiltern (nach dem Mapping) und Datensätze ohne verbleibende Aufträge auslassen; `finishVic` prüft offene Aufträge nur noch für nicht-interne Aufträge.
- Abschließend Typprüfung und Build.
