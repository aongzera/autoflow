import { useState } from "react";
import type {Car} from "../types/types"
import type {Customer} from "../types/types"
type  inputDetail<T> = {
    name : keyof T &string,
    onObjectChange : (e : React.ChangeEvent<HTMLInputElement>) => void
    object : T
}
function InputBox<T>({name ,object, onObjectChange} : inputDetail<T>){
    return (
        <div>
            <label>{name}</label>
            <input name = {name} placeholder={name} onChange={onObjectChange} value={String(object[name])}></input>
        </div>
    )
}
function JobForm(){
    const [Car,setCar] = useState<Car>({
        insurance : "",
        license_plate : "",
        car_type : "",
        brand : "",
        model : "",
        VIN : ""
    })
    const [Customer, setCustomer] = useState<Customer>({
        firstname : "",
        lastname : "",
        tel : "",
        tid : "",
        did : ""
    })
    function handleSubmit(){
        
    }
    function handleChangeCar(e : React.ChangeEvent<HTMLInputElement>) : void{
        setCar({...Car,[e.target.name] : e.target.value})
    }
    function handleChangeCustomer(e : React.ChangeEvent<HTMLInputElement>) : void{
        setCustomer({...Customer,[e.target.name] : e.target.value})
    }
    return (
        <form onSubmit = {handleSubmit}>
            <div>
                <InputBox name = "insurance" object={Car} onObjectChange={handleChangeCar}></InputBox>
                <InputBox name = "license_plate" object={Car} onObjectChange={handleChangeCar}></InputBox>
                <InputBox name = "car_type" object={Car} onObjectChange={handleChangeCar}></InputBox>
                <InputBox name = "brand" object={Car} onObjectChange={handleChangeCar}></InputBox>
                <InputBox name = "model" object={Car} onObjectChange={handleChangeCar}></InputBox>
                <InputBox name = "VIN" object={Car} onObjectChange={handleChangeCar}></InputBox>
            </div>
            <div>
                <InputBox name = "firstname" object={Customer} onObjectChange={handleChangeCustomer}></InputBox>
                <InputBox name = "lastname" object={Customer} onObjectChange={handleChangeCustomer}></InputBox>
                <InputBox name = "tel" object={Customer} onObjectChange={handleChangeCustomer}></InputBox>
                <InputBox name = "tid" object={Customer} onObjectChange={handleChangeCustomer}></InputBox>
                <InputBox name = "did" object={Customer} onObjectChange={handleChangeCustomer}></InputBox>
            </div>
            <div>
                <button>cancel</button>
                <button type="submit">submit</button>
            </div>
            
        </form>
    )
}
export default JobForm