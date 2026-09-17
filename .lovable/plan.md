# Telegram-Benachrichtigungen für neue Aufträge

## Ziel

Ein neuer Reiter „Telegram" im Admin-Panel, in dem du Chat-IDs pflegst. Aufträge im Zuweisen-Popup werden gesammelt und erst beim Klick auf „Speichern" übernommen – danach geht genau eine Benachrichtigung an alle aktiven Chats.

## Reiter /admin/telegram

- Liste aller hinterlegten Chats: Chat-ID, optionale Bezeichnung (z. B. „Team Nord"), Schalter aktiv/inaktiv, Löschen.
- Knopf „Chat hinzufügen" mit Popup: Chat-ID + Bezeichnung.
- Pro Eintrag ein Knopf „Testnachricht senden" mit Rückmeldung, ob es geklappt hat.
- Fehler von Telegram (z. B. falsche Chat-ID, Bot nicht im Chat) werden verständlich auf Deutsch angezeigt.

## Zuweisen-Popup (Admin → Vic-Datensätze)

- Klick auf einen Auftrag markiert ihn nur noch vor (An-/Abwählen), es wird nichts sofort gespeichert.
- Unten „Speichern" und „Abbrechen"; „Speichern" legt alle neu ausgewählten Zuweisungen an und entfernt abgewählte.
- Telefonnummer-Kauf und -Zuweisung bleiben wie bisher sofort wirksam.
- Nach dem Speichern geht eine einzige Benachrichtigung raus, die nur die neu hinzugefügten, für Mitarbeiter sichtbaren Aufträge enthält. Interne Aufträge (21bitcoin) lösen keine Benachrichtigung aus.
- Wurden keine neuen Aufträge hinzugefügt, wird nichts gesendet.
- Schlägt der Versand fehl, bleiben die Zuweisungen gespeichert und du bekommst nur einen Hinweis.

## Beispiel-Benachrichtigung

```text
🚀 3 neue Aufträge verfügbar

👤 Datensatz: Stefan Berger
📋 Aufträge:
  • E-Mail-Konto
  • DKB
  • Deutsche Bank

👉 Jetzt im Panel beanspruchen
```

Bei einem einzelnen Auftrag: „🚀 1 neuer Auftrag verfügbar". Ohne Zeitstempel.

## Technische Umsetzung

- Telegram-Connector „Dev" mit dem Projekt verbinden (Versand über das Lovable-Gateway, Bot-Token bleibt serverseitig).
- Migration: `public.telegram_chats` (chat_id text unique, label text, active boolean default true, created_by, created_at, updated_at) mit GRANTs und RLS – nur Admins dürfen lesen/schreiben.
- `src/lib/telegram.server.ts`: `sendTelegramMessage(chatId, text)` über `https://connector-gateway.lovable.dev/telegram/sendMessage` mit `LOVABLE_API_KEY` + `TELEGRAM_API_KEY`, Fehlerbody wird ausgewertet.
- `src/lib/telegram.functions.ts`: `listTelegramChats`, `createTelegramChat`, `updateTelegramChat`, `deleteTelegramChat`, `sendTelegramTest` – alle mit `requireSupabaseAuth` + Admin-Prüfung.
- `src/lib/vic-auftraege.functions.ts`: neue Server-Funktion `assignAuftraegeBatch({ vic_id, auftrag_ids[] })` – legt fehlende Zuweisungen an (bestehende Logik aus `assignAuftrag` inkl. Passwortlogik und Wiederöffnen abgeschlossener Datensätze), entfernt abgewählte, und verschickt am Ende eine Sammel-Nachricht an alle aktiven Chats.
- `src/routes/_authenticated/admin.telegram.tsx`: neue Route mit head()/noindex, React Query, deutschen Inline-Meldungen im Raisin-Stil; Navigationseintrag „Telegram" (Icon Send) in allen Admin-Seiten.
- `admin.vics.tsx`: lokaler Auswahl-State im Zuweisen-Dialog, Speichern-/Abbrechen-Knöpfe, danach `invalidateQueries`.
