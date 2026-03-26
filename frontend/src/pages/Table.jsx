import { useParams } from "react-router-dom"
import { useState,useEffect } from "react"
import axios from "axios"

export default function Table(){

const {restaurantId,tableNumber} = useParams()

const [menu,setMenu] = useState(null)
const [showPayment,setShowPayment] = useState(false)

/* =======================
   CARGAR MENU
======================= */

useEffect(()=>{

const loadMenu = async()=>{

try{

const res = await axios.get(
`http://localhost:3000/menu/${restaurantId}`
)

setMenu(res.data.menu_url)

}catch(e){

console.log("No hay menú cargado")

}

}

loadMenu()

},[restaurantId])


/* =======================
   LLAMAR MESERO
======================= */

const callWaiter = async()=>{

try{

await axios.post(
"http://localhost:3000/requests/waiter",
{
restaurant_id:restaurantId,
table_number:tableNumber
}
)

alert("🧑‍🍳 Mesero en camino")

}catch(e){

alert("Error enviando solicitud")

}

}


/* =======================
   PEDIR CUENTA (abrir opciones)
======================= */

const openPaymentOptions = ()=>{
setShowPayment(true)
}


/* =======================
   ENVIAR CUENTA CON METODO
======================= */

const sendBillRequest = async(method)=>{

try{

await axios.post(
"http://localhost:3000/requests/bill",
{
restaurant_id:restaurantId,
table_number:tableNumber,
payment_method:method
}
)

setShowPayment(false)

alert("💵 Cuenta solicitada")

}catch(e){

alert("Error enviando solicitud")

}

}


/* =======================
   UI
======================= */

return(

<div style={{
textAlign:"center",
minHeight:"100vh",
display:"flex",
flexDirection:"column",
justifyContent:"center",
alignItems:"center",
background:"#111827",
color:"white",
padding:"20px"
}}>

<h1 style={{
fontSize:"42px",
letterSpacing:"1px",
marginBottom:"10px"
}}>
🍽 Bienvenido
</h1>

<h2 style={{
marginBottom:"40px",
color:"#9ca3af"
}}>
Mesa {tableNumber}
</h2>


{/* MENU */}

{menu ? (

<a
href={`http://localhost:3000${menu}?v=${Date.now()}`}
target="_blank"
rel="noreferrer"
>

<button style={{
padding:"18px 40px",
fontSize:"20px",
margin:"10px",
background:"#3b82f6",
border:"none",
borderRadius:"12px",
color:"white",
cursor:"pointer",
fontWeight:"bold"
}}>
📖 Ver menú
</button>

</a>

):( <p>No hay menú disponible</p> )}


{/* LLAMAR MESERO */}

<button
onClick={callWaiter}
style={{
padding:"18px 40px",
fontSize:"20px",
margin:"10px",
background:"#22c55e",
border:"none",
borderRadius:"12px",
color:"white",
cursor:"pointer",
fontWeight:"bold"
}}
>
🧑‍🍳 Llamar mesero
</button>


{/* PEDIR CUENTA */}

<button
onClick={openPaymentOptions}
style={{
padding:"18px 40px",
fontSize:"20px",
margin:"10px",
background:"#ef4444",
border:"none",
borderRadius:"12px",
color:"white",
cursor:"pointer",
fontWeight:"bold"
}}
>
💵 Pedir cuenta
</button>


{/* =======================
   MODAL METODO DE PAGO
======================= */}

{showPayment && (

<div style={{
position:"fixed",
top:0,
left:0,
width:"100%",
height:"100%",
background:"rgba(0,0,0,0.7)",
display:"flex",
justifyContent:"center",
alignItems:"center"
}}>

<div style={{
background:"#1f2937",
padding:"30px",
borderRadius:"14px",
textAlign:"center",
width:"300px"
}}>

<h3 style={{marginBottom:"20px"}}>
💳 Método de pago
</h3>

<button
onClick={()=>sendBillRequest("cash")}
style={{
width:"100%",
padding:"12px",
margin:"6px 0",
background:"#22c55e",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer"
}}
>
💵 Efectivo
</button>

<button
onClick={()=>sendBillRequest("card")}
style={{
width:"100%",
padding:"12px",
margin:"6px 0",
background:"#3b82f6",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer"
}}
>
💳 Tarjeta
</button>

<button
onClick={()=>sendBillRequest("transfer")}
style={{
width:"100%",
padding:"12px",
margin:"6px 0",
background:"#a855f7",
border:"none",
borderRadius:"8px",
color:"white",
cursor:"pointer"
}}
>
📲 Transferencia
</button>

<button
onClick={()=>setShowPayment(false)}
style={{
marginTop:"10px",
background:"#ef4444",
border:"none",
padding:"10px",
borderRadius:"8px",
color:"white",
cursor:"pointer"
}}
>
Cancelar
</button>

</div>

</div>

)}

</div>

)

}