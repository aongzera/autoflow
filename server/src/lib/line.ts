// server/src/lib/line.ts
export async function replyText(replyToken: string | undefined, text: string) {
  if (!replyToken) return                        // ④ rule 2: no token → do what?

  try {                                        // ⑤ rule 1: nothing may escape
    const res = await fetch("https://api.line.me/v2/bot/message/reply", {          // ① the reply URL
      method: "POST",                          // ② which HTTP verb?
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),  // ③
    })
    if (!res.ok) console.error("reply failed", res.status, await res.text())
  } catch (err) {
    console.log("reply failed (no response)")                                       // ⑥ log it, don't rethrow
  }
}