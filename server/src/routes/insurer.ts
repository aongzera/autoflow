import { Router } from "express";
import { prisma } from "../lib/prisma";
const router = Router()
type insurer = {
    name : string,
    code : string,
}
router.get("/insurer", (req,res) =>{
    const insurer = prisma.insurer.findMany()
    if(!insurer) res.status(400)
    else res.status(200).json(insurer)
})
router.post("/insurer",(req,res)=>{
    const {name,code} : insurer= req.body
    const insurer = prisma.insurer.create({
        data : {
            name : name,
            code : code
        }
    })
    if(!insurer) res.status(400)
    else res.status(200).json(insurer)
})
router.put("/insurer/:id",(req,res)=>{
    const insurerInfo : insurer= req.body
    const id = parseInt(req.params.id)
    const insurer = prisma.insurer.update({
        where : {
            id : id,
        },
        data : insurerInfo
    })
    if(!insurer) res.status(400)
    else res.status(200).json(insurer)
})
export default router

