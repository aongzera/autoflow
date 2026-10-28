import { prisma } from "../lib/prisma";

type NewPhoto = {
    storageUrl : string
    lineMessageId : string
    lineWebhookEventId : string
    createdAt : Date
    lineSenderId? : string
    lineGroupId? : string
}
type Match = {
    claimId : number,
    photoId : number
}
// always saved as UNMATCHED (schema default); routing to a claim is a separate step
export async function createPhoto(input : NewPhoto) {
    return prisma.photo.create({
        data : {
            ...input,
            stage : "CONTACT", //need fixing later
        }
    })
}
export async function matchPhoto(input : Match){
    await prisma.photo.update({
        where : {
            id : input.photoId
        },
        data : {
            matchStatus : "MATCHED",
            claimId : input.claimId
        }
    })
}
