import { Router } from "express";
import { prisma } from "../lib/prisma";
import { FuelLevel } from "@prisma/client";
const router = Router()
type VehicleEquipmentCreateInput = {
    ClaimId : number,
    mileage : number,
    fuelLevel : FuelLevel,
    spareTire : boolean
    hubCap    : boolean,
    jack      : boolean, // แม่แรง
    floorMats : boolean
}
router.post("/vehicleEquipment",async (req,res)=>{
    const equipment :  VehicleEquipmentCreateInput = req.body
    const result  = await prisma.vehicleEquipment.create({
        data : {
            claimId : equipment.ClaimId,
            mileageKm : equipment.mileage,
            fuelLevel : equipment.fuelLevel,
            spareTire : equipment.spareTire,
            hubCap    : equipment.hubCap,
            jack      : equipment.jack, // แม่แรง
            floorMats : equipment.floorMats

        }
    })
})

router.put("/vehicleEquipment",async (req,res)=>{
    const equipment :  VehicleEquipmentCreateInput = req.body
    const result  = await prisma.vehicleEquipment.update({
        where :{
            id : parseInt(req.body.id),
            claimId : equipment.ClaimId
        },
        data : {
            claimId : equipment.ClaimId,
            mileageKm : equipment.mileage,
            fuelLevel : equipment.fuelLevel,
            spareTire : equipment.spareTire,
            hubCap    : equipment.hubCap,
            jack      : equipment.jack, // แม่แรง
            floorMats : equipment.floorMats

        }
    })
})
export default router


