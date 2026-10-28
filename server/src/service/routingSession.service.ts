import { prisma } from "../lib/prisma";
export async function upsertSession(lineGroupId : string, lineSenderId : string, claimId : number){

     await prisma.routingSession.upsert({
        where : {
            lineGroupId_lineSenderId : {
                lineGroupId,lineSenderId
              
        }}
        ,
        update : {
            expiresAt : new Date(new Date().getTime() + 10 * 60 * 1000),
            claimId : claimId
        },
        create : {
            lineGroupId : lineGroupId,
            lineSenderId : lineSenderId,
            expiresAt : new Date(new Date().getTime() + 10 * 60 * 1000),
            claimId : claimId
        }

    }) 
}
export async function getActiveSession(lineGroupId : string, lineSenderId : string) {
    const session = await prisma.routingSession.findUnique({
        where : {
            lineGroupId_lineSenderId : {
                lineGroupId,lineSenderId  
        },  
    },
        select : {
            claimId : true,
            expiresAt : true
        }
    })
    if(!session) return null
    if(session.expiresAt < new Date()) return null
    return session
}
export async function extendSession(lineGroupId : string, lineSenderId : string){

     await prisma.routingSession.update({
        where : {
            lineGroupId_lineSenderId : {
                lineGroupId,lineSenderId
              
        }}
        ,
        data : {
            expiresAt : new Date(new Date().getTime() + 10 * 60 * 1000),
        }
    }) 
}