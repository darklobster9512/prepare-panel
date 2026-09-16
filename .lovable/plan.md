# Mitarbeiterverwaltung im Admin-Panel

## Was entsteht

Ein neuer Bereich **Mitarbeiter** unter `/admin/mitarbeiter`, erreichbar über die Seitenleiste im Admin-Panel.

### Seitenleiste
Die Einträge in der Seitenleiste werden zu echten Links. Der aktive Eintrag wird automatisch hervorgehoben. Im Admin-Panel: „Übersicht" (`/admin`) und „Mitarbeiter" (`/admin/mitarbeiter`).

### Seite „Mitarbeiter"
- Kopfbereich mit kurzer Erklärung und Button „Mitarbeiter hinzufügen".
- Formular (Dialog): nur **E-Mail** und **Passwort** (mind. 6 Zeichen), Passwort mit Auge-Symbol. Beim Anlegen bekommt das Konto automatisch den Rang „Mitarbeiter" und ist sofort einsatzbereit (keine Bestätigungsmail nötig).
- Liste aller vorhandenen Konten mit E-Mail, Rolle und Erstellungsdatum, im gleichen ruhigen Raisin-Stil wie das übrige Panel.
- Deutsche Rückmeldungen: Erfolg („Konto angelegt"), Fehler bei bereits vergebener E-Mail, zu kurzem Passwort oder ungültiger Adresse. Nach dem Anlegen aktualisiert sich die Liste selbst.

### Zugriffsschutz
Nur Administratoren können die Seite öffnen und Konten anlegen. Wer kein Admin ist, landet im Mitarbeiter-Panel. Die Prüfung passiert serverseitig, nicht nur in der Anzeige.

## Technische Umsetzung

- Neue Route `src/routes/_authenticated/admin.mitarbeiter.tsx` (Pfad `/admin/mitarbeiter`), mit eigenem `head()` inkl. `noindex`, analog zu den bestehenden Panel-Routen.
- `src/components/panel-shell.tsx`: `NavItem` bekommt ein `to`-Feld; Einträge rendern als `<Link>` mit `activeProps` statt als `<button>`. `admin.tsx` und `mitarbeiter.tsx` erhalten die passenden Ziele.
- Neue Server-Functions in `src/lib/admin-users.functions.ts` mit `.middleware([requireSupabaseAuth])`:
  - `listEmployees` – liest `profiles` + `user_roles` über `context.supabase` (RLS-Admin-Policy greift).
  - `createEmployee` – zod-validiert E-Mail/Passwort, prüft zuerst per `context.supabase` über `has_role`, dass der Aufrufer Admin ist, und legt danach mit dem im Handler dynamisch importierten Admin-Client (`@/integrations/supabase/client.server`) den Nutzer via `auth.admin.createUser({ email, password, email_confirm: true })` an. Profil und Mitarbeiter-Rolle kommen über den bestehenden `handle_new_user`-Trigger.
- Aufruf im Client über `useServerFn` + React Query (`useQuery` für die Liste, `useMutation` fürs Anlegen, danach `invalidateQueries`) – keine geschützte Server-Function im Loader.
- Dialog/Formular mit vorhandenen shadcn-Komponenten, Farben ausschließlich über bestehende Design-Tokens.
