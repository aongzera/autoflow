import { prisma } from "../lib/prisma";
export async function findClaimByPlate(plate : string) : Promise<{ id: number }[]>{
    const listClaimId = await prisma.claim.findMany({
        where : {
            vehicle : {
                licensePlate : plate
            },
            stage : {
                notIn : ["DONE", "CANCELLED"]
            }
    }, select : {
        id : true
        }
    }
)
return listClaimId
}