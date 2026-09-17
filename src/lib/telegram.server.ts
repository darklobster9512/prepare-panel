const API_BASE = "https://api.telegram.org";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export { escapeHtml };

export async function sendTelegramMessage(chatId: string, text: string) {
  const token = process.env["TELEGRAM_BOT_TOKEN"];
  if (!token) {
    throw new Error("Telegram ist nicht eingerichtet (Bot-Token fehlt).");
  }

  const response = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });

  const body = await response.text();

  if (!response.ok) {
    console.error(`Telegram sendMessage failed [${response.status}]: ${body}`);
    throw new Error(
      `Telegram konnte die Nachricht nicht senden (${response.status}).`,
    );
  }

  try {
    const parsed = JSON.parse(body) as { ok?: boolean; description?: string };
    if (parsed.ok === false) {
      console.error(`Telegram sendMessage error: ${body}`);
      throw new Error(
        `Telegram-Fehler: ${parsed.description ?? "Unbekannter Fehler"}`,
      );
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Telegram-Fehler")) throw err;
  }

  return { ok: true };
}

/** Sendet an alle Chat-IDs; einzelne Fehler brechen den Versand nicht ab. */
export async function broadcastTelegramMessage(chatIds: string[], text: string) {
  let sent = 0;
  for (const chatId of chatIds) {
    try {
      await sendTelegramMessage(chatId, text);
      sent += 1;
    } catch (err) {
      console.error(
        `Telegram-Versand an ${chatId} fehlgeschlagen:`,
        err instanceof Error ? err.message : err,
      );
    }
  }
  return { sent };
}

export function buildNewAuftraegeMessage(params: {
  vicName: string;
  auftragNames: string[];
}) {
  const count = params.auftragNames.length;
  const headline =
    count === 1
      ? "🆕 Es ist 1 neuer Auftrag verfügbar"
      : `🆕 Es sind ${count} neue Aufträge verfügbar`;

  const list = params.auftragNames
    .map((name) => `   • ${escapeHtml(name)}`)
    .join("\n");

  return [
    `<b>${headline}</b>`,
    "",
    `👤 Datensatz: <b>${escapeHtml(params.vicName)}</b>`,
    "",
    "📋 Aufträge:",
    list,
    "",
    "⚡ Jetzt im Mitarbeiter-Panel beanspruchen",
  ].join("\n");
}
