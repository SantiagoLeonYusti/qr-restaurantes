import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import { API_URL } from "../config"


export default function Register(){

const navigate = useNavigate()

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const register = async ()=>{

try{


await axios.post(`${API_URL}/auth/register`,{
name,
email,
password
})

alert("Cuenta creada")

navigate("/login")

}catch(e){

alert("Error registrando")

}

}

return(

<div style={{
display:"flex",
flexDirection:"column",
alignItems:"center",
justifyContent:"center",
height:"100vh",
background:"#111827",
color:"white"
}}>

<h1>Crear cuenta restaurante</h1>

<input
placeholder="Nombre restaurante"
value={name}
onChange={(e)=>setName(e.target.value)}
style={{margin:"10px",padding:"10px"}}
/>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{margin:"10px",padding:"10px"}}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{margin:"10px",padding:"10px"}}
/>

<button
onClick={register}
style={{
padding:"10px 20px",
background:"#3b82f6",
border:"none",
borderRadius:"5px",
color:"white"
}}
>

Crear cuenta

</button>

</div>

)

}