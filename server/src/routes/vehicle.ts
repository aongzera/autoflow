import { Router} from "express"
import { prisma } from "../lib/prisma"

const router = Router()
type vehicle = {
    VIN : string, 
  licensePlate : string, // ทะเบียน = กุญแจหลักตอน LINE router จับคู่รูปเข้าคัน
  province     : string, // ทะเบียนซ้ำกันข้ามจังหวัดได้ ต้องมีจังหวัดคู่กันเสมอ
  brand        : string | undefined,
  model        : string | undefined
}
router.post("/vehicle",(req,res)=>{
    const {VIN, licensePlate,province,brand,model} : vehicle = req.body
    const vehicle = prisma.vehicle.create({
        data : {
            VIN : VIN,
            licensePlate : licensePlate,
            province : province,
            brand : brand,
            model : model
        }
    })
    if(!vehicle) res.status(400)
    else res.status(201)
})
router.put("/vehicle",(req,res)=>{
    const {VIN, licensePlate,province,brand,model} : vehicle = req.body
    const vehicle = prisma.vehicle.update({
        where : {
            VIN : VIN
        },
        data : {
            licensePlate : licensePlate,
            province : province,
            brand : brand,
            model : model
        }
    })
    if(!vehicle) res.status(400)
    else res.status(200)
})
export default router

