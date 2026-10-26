import { useRef, useState } from "react";
function CapturePhoto(){
    const [file,setFile] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    function handleOnClick(e: React.ChangeEvent<HTMLInputElement>) : void{
        
    }
    return (
        <>
            <input ref={fileInputRef} type="file" multiple accept="image/*" capture = "environment" onClick={}></input>
            <button type = "button" onClick={fileInputRef.current?.click}>+</button>
        </>
    )
}