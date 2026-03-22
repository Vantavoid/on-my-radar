/**
 * Telegram notification helper.
 * Sends messages to Lee via the Bot API.
 */

const CHAT_ID = '1753904253'

export async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.warn('[notify] No TELEGRAM_BOT_TOKEN — skipping notification')
    return
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text,
        parse_mode: 'Markdown',
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error(`[notify] Telegram API error: ${res.status} ${err}`)
    }
  } catch (err) {
    console.error('[notify] Failed to send Telegram message:', err)
  }
}
