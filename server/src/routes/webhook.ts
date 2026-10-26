import { Router, Request, Response, NextFunction } from "express"
import { middleware, SignatureValidationFailed, webhook} from "@line/bot-sdk"
import "dotenv/config"
import { uploadImage } from "../lib/storage"
const router = Router()

// 1) runs only when the signature is GOOD
router.post("/webhooks", middleware({ channelSecret: process.env.LINE_CHANNEL_SECRET! }), async (req, res) => {
  res.sendStatus(200)
  // later: req.body.events is where LINE's messages will be
  const events: webhook.Event[] = req.body.events
  const messages = events.filter(x => x.type == "message").map(x=>x.message)
  for(const message of messages){
    if(message.type=='image'){
          const content = await fetch(`https://api-data.line.me/v2/bot/message/${message.id}/content`, {
        headers: { Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}` },
        })
        const bytes = Buffer.from(await content.arrayBuffer())
        const contentType = content.headers.get("content-type") ?? "image/jpeg"
        try {
            const result = await uploadImage(message.id,contentType,bytes)

        }catch{

        }
    }
    if(message.type == 'text'){
      const content = message.text
      console.log(message.id, content)
    }
  }
})

// 2) runs only when something went WRONG (4 parameters = error handler)
router.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SignatureValidationFailed) {
    res.sendStatus(401)   // bad signature -> "you're not LINE"
    return
  }
  console.error(err)
  res.sendStatus(500)     // any other error
})

export default router
