import { useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"

export default function Login(){

const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const navigate = useNavigate()

const login = async ()=>{

try{

const res = await axios.post(
"http://localhost:3000/auth/login",
{email,password}
)

localStorage.setItem("restaurant_id",res.data.id)
localStorage.setItem("role",res.data.role)

if(res.data.role === "admin"){

navigate("/admin")

}else{

navigate("/dashboard")

}

}catch(e){

alert("❌ Credenciales incorrectas")

}

}



return(

<div style={{
display:"flex",
justifyContent:"center",
alignItems:"center",
height:"100vh",
background:"linear-gradient(135deg,#111827,#1f2937)",
fontFamily:"Arial"
}}>

<div style={{
background:"#ffffff",
padding:"40px",
borderRadius:"12px",
width:"350px",
boxShadow:"0 10px 30px rgba(0,0,0,0.3)"
}}>

<h1 style={{
textAlign:"center",
marginBottom:"30px",
color:"#111827"
}}>
🍽 Panel Restaurante
</h1>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{
width:"100%",
padding:"12px",
marginBottom:"15px",
borderRadius:"6px",
border:"1px solid #ccc",
fontSize:"14px"
}}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{
width:"100%",
padding:"12px",
marginBottom:"20px",
borderRadius:"6px",
border:"1px solid #ccc",
fontSize:"14px"
}}
/>

<button
onClick={login}
style={{
width:"100%",
padding:"12px",
background:"#3b82f6",
border:"none",
borderRadius:"6px",
color:"white",
fontSize:"16px",
cursor:"pointer",
fontWeight:"bold"
}}
>

Ingresar

</button>

<p style={{
textAlign:"center",
marginTop:"20px",
fontSize:"14px"
}}>

¿No tienes cuenta?

<span
onClick={()=>navigate("/register")}
style={{
color:"#3b82f6",
cursor:"pointer",
marginLeft:"5px",
fontWeight:"bold"
}}
>

Crear cuenta

</span>

</p>

</div>

</div>

)

}