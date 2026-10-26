# Telegram-Bot-Token austauschen

## Ablauf
1. Ich öffne ein sicheres Eingabefeld für `TELEGRAM_BOT_TOKEN`. Dort trägst du den neuen Token von @BotFather ein (Format `123456789:ABC...`). Der Wert läuft nicht durch den Chat.
2. Der alte Token-Eintrag in der mitgelieferten `.env` wird so ersetzt, dass dein Server ebenfalls den neuen Token nutzt.
3. Prüfung: Unter Admin → Telegram eine Testnachricht an einen Empfänger senden.

## Hinweise
- Nach dem Austausch den alten Token bei @BotFather widerrufen (`/revoke`), falls er bekannt geworden ist.
- Auf dem Server danach: `git pull`, `npm install`, `npm run build`, `pm2 restart prepare-panel`.
- Am Code ändert sich nichts, der Token wird weiterhin nur serverseitig gelesen.
