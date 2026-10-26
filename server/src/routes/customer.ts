import { Router } from "express";
import { prisma } from "../lib/prisma";
const router = Router()
type customer = { 
  thaiId          : string | undefined, 
  driverLicenseNo : string | undefined, 
  name            : string,
  phone           : string,
  lineUserId      : string | undefined, // เผื่อผูกบัญชี LINE ลูกค้าในอนาคต
}
router.post("/customer",(req,res) =>{
    const customerInfo : customer = req.body
    const customer = prisma.customer.create({
        data : customerInfo
    })
    if(!customer) res.status(400)
    else res.send(201)
})
router.put("/customer/:id",(req,res) =>{
    const customerInfo : customer = req.body
    const id : number= parseInt(req.params.id)
    const customer = prisma.customer.update({
        where : {
            id : id
        },
        data : customerInfo
    })
    if(!customer) res.status(400)
    else res.send(201)
})
export default router

