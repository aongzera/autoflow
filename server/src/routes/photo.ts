import { Router } from "express";
import { getUnmatchedPhoto } from "../service/photo.service";
import { groupIntoBursts,PhotoLite } from "../service/burst.service";
import { error } from "node:console";
const router = Router()

router.get("/photos/unmatched",async (req,res)=> {
    try{
        const photos : PhotoLite[] = await getUnmatchedPhoto()
        const groupPhotos : PhotoLite[][] = groupIntoBursts(photos,10*60*1000)
        res.status(200).send(groupPhotos)
    }catch(err){
        console.error("unmatched photos failed", error)    // ③ log it
        res.status(500).json({ message: "failed to load photos" }) 
    }
})
export default router