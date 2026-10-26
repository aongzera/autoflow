import { Router, Request, Response, NextFunction } from "express"
import { middleware, SignatureValidationFailed, webhook} from "@line/bot-sdk"
import "dotenv/config"
import { uploadImage } from "../lib/storage"
import { prisma } from "../lib/prisma"
const router = Router()

// 1) runs only when the signature is GOOD
router.post("/webhooks", middleware({ channelSecret: process.env.LINE_CHANNEL_SECRET! }), async (req, res) => {
  res.sendStatus(200)
  // later: req.body.events is where LINE's messages will be
  const events: webhook.Event[] = req.body.events
  // keep the whole EVENT (not just event.message): group id, sender id and timestamp live on it
  const messageEvents = events.filter(x => x.type === "message")
  for(const event of messageEvents){
    const message = event.message
    if(message.type === 'image'){
      const key = `line/${message.id}.jpg`
      const existingPic = await prisma.photo.findUnique({
        where : {
          lineWebhookEventId : event.webhookEventId
        }
      })
      if(existingPic) continue
      try {
        const content = await fetch(`https://api-data.line.me/v2/bot/message/${message.id}/content`, {
          headers: { Authorization: `Bearer ${process.env.CHANNEL_ACCESS_TOKEN}` },
        })
        if(!content.ok) {
          throw new Error(`content loading failed: ${content.status}`)
        }
        const bytes = Buffer.from(await content.arrayBuffer())
        const contentType = content.headers.get("content-type") ?? "image/jpeg"
        await uploadImage(key, contentType, bytes)
        // next: prisma.photo.create(...) using `key` + event.source / event.timestamp
        await prisma.photo.create({
          data : {
              storageUrl:    key,                // ① the key variable
              stage:         "CONTACT",
              lineMessageId: event.message.id,                // ② message id
              lineSenderId:  event.source?.userId,
              lineGroupId:   event.source?.type === "group" ? event.source.groupId : undefined,                // ③ only group chats have a groupId
              createdAt:new Date(event.timestamp),
              lineWebhookEventId: event.webhookEventId  
          }    // ④ LINE's timestamp, on the event
        })
      } catch(err) {
        console.error("photo failed", message.id, err)
      }
    }
    if(message.type === 'text'){
      console.log(message.id, message.text)
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
