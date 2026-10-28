import { Router, Request, Response, NextFunction } from "express"
import { middleware, SignatureValidationFailed, webhook} from "@line/bot-sdk"
import "dotenv/config"
import { uploadImage } from "../lib/storage"
import { prisma } from "../lib/prisma"
import { parsePlate } from "../lib/plate"
import { upsertSession,getActiveSession,extendSession } from "../service/routingSession.service"
import { findClaimByPlate } from "../service/claim.service"
import { createPhoto,matchPhoto } from "../service/photo.service"
const router = Router()

async function handleImage(event: webhook.MessageEvent, message: webhook.ImageMessageContent) {

  // your existing code: key, dedupe check, fetch, upload, prisma.photo.create
  // use `message.id` and `event.source / event.timestamp / event.webhookEventId`
    const key = `line/${message.id}.jpg`
    const existingPic = await prisma.photo.findUnique({
        where : {
          lineWebhookEventId : event.webhookEventId
        }
      })
      if(existingPic) return
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
        let lineSenderId = event.source?.userId
        let lineGroupId = event.source?.type === "group" ? event.source.groupId : undefined

        const photo = await createPhoto({
          storageUrl:         key,
          lineMessageId:      message.id,
          lineSenderId,
          lineGroupId,
          createdAt:          new Date(event.timestamp),
          lineWebhookEventId: event.webhookEventId,
        })
        lineGroupId = lineGroupId ? lineGroupId : ""
        lineSenderId = lineSenderId ? lineSenderId : ""
        if (!lineGroupId || !lineSenderId) return

        const session = await getActiveSession(lineGroupId,lineSenderId)
        
        if(!session) return
        await matchPhoto({
          claimId : session.claimId,
          photoId : photo.id
        })
        await extendSession(lineGroupId ? lineGroupId : "",lineSenderId ? lineSenderId : "")
      } catch(err) {
        console.error("photo failed", message.id, err)
      }
}
async function handleText(event: webhook.MessageEvent, message: webhook.TextMessageContent) {
  const parsed = parsePlate(message.text)
  if(!parsed) {
    console.log("not a plate, ignored:", message.text)
    return
  }
  console.log("plate:", parsed.plate)
  const lineGroupId =  event.source?.type === "group" ? event.source.groupId : undefined
  const lineSenderId = event.source?.userId ? event.source?.userId : undefined 

  if(!lineGroupId||!lineSenderId) return
  const listClaimId = await findClaimByPlate(parsed.plate)

  if((listClaimId).length !== 1) return
  const claimId = listClaimId[0].id
  await upsertSession(lineGroupId,lineSenderId,claimId)
}

// 1) runs only when the signature is GOOD
router.post("/webhooks", middleware({ channelSecret: process.env.LINE_CHANNEL_SECRET! }), async (req, res) => {
  res.sendStatus(200)
  // later: req.body.events is where LINE's messages will be
  const events: webhook.Event[] = req.body.events
  // keep the whole EVENT (not just event.message): group id, sender id and timestamp live on it
  const messageEvents = events.filter(x => x.type === "message")
  for(const event of messageEvents){
    const message = event.message
    switch (message.type) {
      case "image": await handleImage(event, message); break
      case "text":  await handleText(event, message); break        // ①
      default:  continue                                     // ②
  }
}
}
)

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
