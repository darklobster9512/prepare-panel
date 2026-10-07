# Neuer Admin-Reiter „Bankkonten"

## Was du bekommst
- Neuer Punkt **„Bankkonten"** in der Admin-Navigation (unter `/admin/bankkonten`), nur für Admins.
- Oben ein Knopf **„Bankkonto hinzufügen"** → Popup mit den Feldern:
  - Kontoinhaber (Pflicht), Bank (Pflicht), IBAN (optional)
  - Projekt (Auswahlliste aus deinen Projekten, optional „Kein Projekt")
  - Dokumente hochladen: beliebig viele Bilder und PDFs
  - Briefe vollständig? Ja/Nein (optional – „nicht angegeben" möglich)
  - Gekoppelt? Ja/Nein
  - VMOS-Gerät, Anosim-Link, Notizen (optional)
  - Anmeldedaten: frei benennbare Felder (Bezeichnung + Wert), mit „+ Feld hinzufügen" und Entfernen-Knopf
- **Tabelle** aller Bankkonten, neueste oben: Kontoinhaber, Bank, IBAN, Projekt, Gekoppelt, Briefe, Anzahl Dokumente, angelegt am. Suchfeld für Inhaber/Bank/IBAN.
- **Klick auf eine Zeile** → Detail-Popup mit allen Angaben (Kopier-Symbole bei IBAN, Anmeldedaten, Links), Dokumenten-Vorschau (Bilder als Miniatur mit Vergrößern, PDFs zum Öffnen in neuem Tab), direkt bearbeitbar mit „Speichern", plus Dokumente hinzufügen/entfernen und Bankkonto löschen (mit Rückfrage).

## Technische Details
- Migration: Tabelle `bank_accounts` (`account_holder`, `bank`, `iban`, `project_id` → projects, `letters_complete boolean null`, `coupled boolean default false`, `vmos_device`, `credentials jsonb default '[]'` als `[{label, value}]`, `anosim_link`, `notes`, `documents jsonb default '[]'` als `[{path, name, type, size}]`, `created_by`, Zeitstempel + `update_updated_at_column`-Trigger). RLS: alle Operationen nur `has_role(auth.uid(),'admin')`.
- Privater Storage-Bucket `bank-documents` mit Admin-only-Policies (select/insert/delete); Upload und signierte Links direkt im Browser (wie bei den Auftragslogos, funktioniert auf dem VPS).
- `src/lib/bank-accounts.functions.ts`: `listBankAccounts`, `createBankAccount`, `updateBankAccount`, `deleteBankAccount` (requireSupabaseAuth + Admin-Prüfung, zod-Validierung); beim Löschen werden auch die Dateien entfernt.
- Neue Route `src/routes/_authenticated/admin.bankkonten.tsx` (eigener head, noindex) mit Tabelle, Anlage-/Detail-Dialog (gemeinsames Formular).
- Nav-Eintrag „Bankkonten" (Symbol Landmark) in allen Admin-Seiten nach „Vics".
