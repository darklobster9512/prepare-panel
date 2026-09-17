# Telegram-Benachrichtigungen für neue Aufträge

## Neuer Reiter „Telegram" (/admin/telegram)

Im Admin-Panel kommt ein Reiter „Telegram" dazu. Dort kannst du:

- Chat-IDs hinzufügen (Chat-ID + freier Name, z. B. „Team-Gruppe").
- Empfänger aktiv/inaktiv schalten und wieder löschen.
- Pro Empfänger einen Test senden („Testnachricht"), damit du siehst, ob die Chat-ID stimmt.

Der Bot-Token wird als Secret in Supabase hinterlegt (`TELEGRAM_BOT_TOKEN`) – ich frage dich nach dem Speichern des Plans danach. Der Token wird nur serverseitig gelesen, nie im Browser.

## Zuweisen-Popup: erst speichern, dann zuweisen

Heute wird jeder Auftrag sofort beim Anklicken zugewiesen. Künftig:

- Im Popup wählst du Aufträge an und ab – das ist zunächst nur eine Vormerkung.
- Unten gibt es „Speichern" und „Abbrechen". Erst beim Speichern werden alle Änderungen (Zuweisen und Entfernen) in einem Rutsch ausgeführt.
- Danach geht **eine** Benachrichtigung raus, die alle neu zugewiesenen Aufträge zusammenfasst. Entfernte Aufträge lösen keine Benachrichtigung aus.
- Interne Aufträge (21bitcoin) werden nicht mitgemeldet, da Mitarbeiter sie nicht sehen.

## Beispiel-Benachrichtigung

```text
🆕 Es sind 3 neue Aufträge verfügbar

👤 Datensatz: Stefan Müller

📋 Aufträge:
   • E-Mail-Konto
   • DKB
   • Deutsche Bank

⚡ Jetzt im Mitarbeiter-Panel beanspruchen
```

Bei nur einem Auftrag: „🆕 Es ist 1 neuer Auftrag verfügbar".

## Technische Details

- Migration `public.telegram_recipients` (id uuid pk, chat_id text not null unique, label text, active boolean not null default true, created_by uuid, created_at, updated_at) inkl. `GRANT SELECT, INSERT, UPDATE, DELETE ... TO authenticated` und `GRANT ALL ... TO service_role`; RLS mit `has_role(auth.uid(),'admin')` für alle Operationen.
- Secret `TELEGRAM_BOT_TOKEN` über das Secrets-Tool (Supabase-Umgebung), Abruf per `process.env` ausschließlich im Handler.
- `src/lib/telegram.server.ts`: `sendTelegramMessage(chatId, text)` direkt gegen `https://api.telegram.org/bot<token>/sendMessage` (kein Lovable-Gateway), `parse_mode: "HTML"`, Fehler mit Status + Body protokollieren, nie werfen wenn nur ein Empfänger fehlschlägt.
- `src/lib/telegram.functions.ts`: `listTelegramRecipients`, `createTelegramRecipient`, `updateTelegramRecipient`, `deleteTelegramRecipient`, `sendTelegramTest` – alle mit `requireSupabaseAuth` + Admin-Prüfung via `has_role`, zod-Validierung, deutsche Fehlermeldungen.
- `src/lib/vic-auftraege.functions.ts`: neue Server-Funktion `assignAuftraegeBulk({ vicId, auftragIds, removeAuftragIds })` – führt die bestehende Zuweisungs-/Entfernungslogik (inkl. `buildCredentials`, admin_only-Sofortabschluss, Reaktivierung abgeschlossener Datensätze) pro ID aus und verschickt danach einmalig die Sammel-Benachrichtigung an alle aktiven Empfänger.
- `src/routes/_authenticated/admin.vics.tsx`: Zuweisen-Dialog bekommt lokalen State `pendingIds` (Set), initialisiert aus den vorhandenen Zuweisungen; Klick toggelt nur lokal; „Speichern" ruft `assignAuftraegeBulk` mit Differenz auf und invalidiert `["admin","vics"]`; „Abbrechen" verwirft. `assignAuftrag`/`unassignAuftrag` bleiben für andere Aufrufer erhalten.
- `src/routes/_authenticated/admin.telegram.tsx`: neue Route mit `head()` (Titel „Telegram – Admin-Panel | IdentPanel", noindex), Tabelle der Empfänger, Dialog zum Hinzufügen, Rollen-Weiterleitung wie in den übrigen Admin-Seiten. Nav-Eintrag „Telegram" (Icon `Send`) in allen Admin-Seiten ergänzen.
- Styling nur über bestehende Design-Tokens, alle Meldungen deutsch und inline.
