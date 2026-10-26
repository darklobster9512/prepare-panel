# Telegram-Benachrichtigungen bei übertragenen Vics

## Befund
- Die letzten 4 Vics (Annette, Sabine, Friedrich Werner Peter, Rudolf) kamen alle über das externe Panel (`/api/public/vics`) auf `prepare-panel.xyz` und haben Aufträge – eine Nachricht hätte also rausgehen müssen.
- Aktiver Empfänger ist die Gruppe „Vorbereitungen - Anträge" (seit heute 08:32). Mit dem neuen Bot-Token erreicht der Bot diese Gruppe einwandfrei.
- Die Server-Protokolle von `prepare-panel.xyz` sind für mich nicht einsehbar. Wahrscheinlichste Ursache (unbestätigt): Dein Server läuft noch mit dem alten Bot-Token, weil nach dem Token-Wechsel noch kein `git pull` + Neustart lief. Der alte Bot ist nicht in der neuen Gruppe, Telegram lehnt ab, und der Fehler wird bisher nur still ins Server-Log geschrieben.

## Sofort prüfen (du, auf dem Server)
`rm -f package-lock.json; git pull; npm install; npm run build; pm2 restart prepare-panel --update-env`, danach unter Admin → Telegram eine Testnachricht senden. Optional: `pm2 logs prepare-panel | grep -i telegram` zeigt den genauen Fehler.

## Was ich einbaue, damit das nicht mehr unbemerkt passiert
1. Jeder Telegram-Versand bei übertragenen und im Admin zugewiesenen Aufträgen wird protokolliert (Zeit, Datensatz, Empfänger, Erfolg oder Telegram-Fehlermeldung).
2. Auf der Seite Admin → Telegram erscheint eine Liste „Letzte Benachrichtigungen" mit diesem Status, Fehler rot markiert.
3. Button „Erneut senden" pro fehlgeschlagener Benachrichtigung, damit du die 4 verpassten nachholen kannst.

## Technische Details
- Neue Tabelle `telegram_log` (vic_id, chat_id, ok, error, message, created_at), RLS nur Admin; Schreiben über `supabaseAdmin` in `broadcastTelegramMessage`.
- `broadcastTelegramMessage` gibt pro Chat Erfolg/Fehler zurück und schreibt den Log; Aufrufer in `vics.ts` und `vic-auftraege.functions.ts` übergeben `vic_id`.
- Serverfunktion zum Lesen der Logs und zum erneuten Senden (Admin-Prüfung via `has_role`).
