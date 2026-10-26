import { Router } from "express";
import { prisma } from "../lib/prisma";
import { ClaimStage } from "@prisma/client";

const router = Router()
type Claim = {
    vehicleId : string,
    customerId : number,
    insurerId : number,
    claimDocNo : string
}
router.get("/claim/:id",async (req,res) =>{
    const id : number = parseInt(req.params.id)
    const claims = await prisma.claim.findUnique({
        where : {
            id : id
        },
        include : {
            customer : true,
            insurer : true,
            vehicle : true,
            vehicleEquipment : true
        },
    })
    if(!claims)res.status(400)
    else res.status(200).json(claims)
})
router.get("/claim/",async (req,res)=>{
    const stage = req.query.stage
    let enumStage : ClaimStage | null = null
    switch(stage){
        case "CONTACTED" :enumStage = ClaimStage.CONTACTED;
        case "PRICED"    :enumStage = ClaimStage.PRICED;
        case "DROPPED_OFF": enumStage = ClaimStage.DROPPED_OFF
        case "IN_REPAIR"  : enumStage = ClaimStage.IN_REPAIR
        case "DONE"       : enumStage = ClaimStage.DONE
        case "CANCELLED"  : enumStage = ClaimStage.CANCELLED
        default : enumStage = null
    }
    
   if(!enumStage){
        res.status(400)
   }else{
        const claims = await prisma.claim.findMany({
        where : {
            stage : enumStage
        },
        include : {
            insurer : true,
            vehicle : true,
        }
    })
        res.status(200).send(claims)
   }
})
router.get("/claim",async (req,res)=>{
    const plate : string = String(req.query.plate)
    const claims = await prisma.claim.findMany({
        where : {
            vehicle : {
                licensePlate : plate
            }
        },
        include : {
            vehicle : true,
            insurer : true
        }
    })
    if(!claims) res.status(400)
    else res.status(200).send(200)
})

router.post("/claim",async (req,res) => {
    const claimInfo : Claim = req.body
    const claim = prisma.claim.create({
        data : claimInfo,
    })
    if(!claim)res.status(400)
    else res.status(200).json(claim)
})
router.put("/claim/:id",async (req,res) => {
    const claimInfo : Claim = req.body
    const id = parseInt(req.params.id)
    const claim = prisma.claim.update({
        where : {
            id : id
        },
        data : claimInfo,
    })
    if(!claim)res.status(400)
    else res.status(200).json(claim)
})
export default router

