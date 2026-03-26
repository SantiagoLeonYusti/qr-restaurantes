import { useEffect,useState,useRef } from "react"
import { io } from "socket.io-client"
import axios from "axios"

export default function Dashboard(){

const [requests,setRequests] = useState([])
const [time,setTime] = useState(Date.now())
const [stats,setStats] = useState(null)

const restaurantId = localStorage.getItem("restaurant_id")

const socketRef = useRef(null)


// LOGOUT
const logout = () => {

localStorage.removeItem("restaurant_id")
localStorage.removeItem("role")

window.location.href = "/login"

}


// CONTADOR
const pendingCount = requests.filter(
r => r.status === "pending"
).length



// CARGAR SOLICITUDES PENDIENTES
useEffect(()=>{

if(!restaurantId) return

const loadPending = async()=>{

try{

const res = await axios.get(
"http://localhost:3000/requests/pending/"+restaurantId
)

setRequests(res.data)

}catch(e){

console.log("Error cargando solicitudes")

}

}

loadPending()

},[restaurantId])



// CARGAR ESTADISTICAS
useEffect(()=>{

if(!restaurantId) return

const loadStats = async ()=>{

try{

const res = await axios.get(
"http://localhost:3000/stats/"+restaurantId
)

setStats(res.data)

}catch(e){

console.log("Error cargando stats")

}

}

loadStats()

const interval = setInterval(()=>{
setTime(Date.now())
},1000)

return ()=>clearInterval(interval)

},[restaurantId])



// SOCKET (ARREGLADO 🔥)
useEffect(()=>{

if(!restaurantId) return

// evitar duplicados
if(socketRef.current) return

const socket = io("http://localhost:3000",{
transports:["websocket"]
})

socketRef.current = socket

socket.on("connect",()=>{
console.log("🟢 Conectado:", socket.id)
})

// unirse al restaurante
socket.emit("joinRestaurant",restaurantId)


// NUEVA SOLICITUD
const newRequestHandler = (data)=>{

const audio = new Audio("/notification.mp3")
audio.volume = 0.7
audio.play().catch(()=>{})

alert("🔔 Nueva solicitud de mesa " + data.table_number)

setRequests(prev=>[
{...data,status:"pending"},
...prev
])

}


// ACTUALIZAR
const updateHandler = (id)=>{

setRequests(prev=>
prev.map(r=>
r.id === id 
? {...r, status:"attended", updated_at: new Date()} 
: r
)
)

}


socket.on("newRequest",newRequestHandler)
socket.on("requestUpdated",updateHandler)


socket.on("disconnect",()=>{
console.log("🔴 Socket desconectado")
})


return ()=>{

if(socketRef.current){

socketRef.current.off("newRequest",newRequestHandler)
socketRef.current.off("requestUpdated",updateHandler)

socketRef.current.disconnect()
socketRef.current = null

}

}

},[restaurantId])



// MARCAR ATENDIDO
const attendRequest = async(id)=>{

await axios.post(
"http://localhost:3000/requests/attended",
{id}
)

}



// TIEMPO ESPERA
const getWaitingTime = (date)=>{
const now = new Date()
const created = new Date(date)
const seconds = Math.floor((now - created)/1000)
const minutes = Math.floor(seconds/60)
const remainingSeconds = seconds % 60
return minutes+"m "+remainingSeconds+"s"

}

// TIEMPO DE RESPUESTA
const getResponseTime = (request) => {
  if(!request.updated_at) return getWaitingTime(request.created_at) // sigue pendiente

  const start = new Date(request.created_at)
  const end = new Date(request.updated_at)
  const diffSec = Math.floor((end - start)/1000)
  const minutes = Math.floor(diffSec / 60)
  const seconds = diffSec % 60
  return `${minutes}m ${seconds}s`
}



// COLOR PRIORIDAD
const getUrgencyColor = (date)=>{

const seconds = Math.floor(
(new Date() - new Date(date))/1000
)

if(seconds < 60) return "#22c55e"
if(seconds < 180) return "#facc15"

return "#ef4444"

}



return(

<div style={{
padding:"40px",
background:"#111827",
minHeight:"100vh",
color:"white"
}}>


{/* HEADER */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"20px"
}}>

<h1>
🍽 Panel del Restaurante
</h1>

<button
onClick={logout}
style={{
background:"#ef4444",
color:"white",
border:"none",
padding:"10px 18px",
borderRadius:"8px",
cursor:"pointer",
fontWeight:"bold"
}}
>

🚪 Cerrar sesión

</button>

</div>



{/* CONTADOR */}

<div style={{
fontSize:"28px",
fontWeight:"bold",
marginBottom:"30px",
background:"#1f2937",
padding:"20px",
borderRadius:"12px",
display:"inline-block"
}}>

🔔 Solicitudes pendientes

<span style={{
color:"#facc15",
marginLeft:"10px",
fontSize:"34px"
}}>
{pendingCount}
</span>

</div>



{/* ESTADISTICAS */}

{stats && (

<div style={{
background:"#1f2937",
padding:"20px",
borderRadius:"12px",
marginBottom:"30px"
}}>

<h3>📊 Estadísticas de hoy</h3>

<p>
Solicitudes hoy: {stats.today}
</p>

<p>
Tiempo promedio de atención: {
stats.avg_time
? Math.round(stats.avg_time)+" segundos"
: "0"
}
</p>

<h4>Mesas más activas</h4>

{stats.tables.map(t=>(

<p key={t.table_number}>
Mesa {t.table_number} → {t.total} solicitudes
</p>

))}

</div>

)}



{/* SIN SOLICITUDES */}

{requests.length === 0 && (
<p>No hay solicitudes</p>
)}



{/* LISTA */}

{requests.map((r)=>(

<div
key={r.id}
style={{
background:"#1f2937",
borderRadius:"14px",
padding:"25px",
marginBottom:"20px",
borderLeft:"6px solid "+getUrgencyColor(r.created_at),
boxShadow:"0 4px 12px rgba(0,0,0,0.4)"
}}
>

<h3 style={{marginBottom:"10px"}}>
Mesa {r.table_number}
</h3>

<p>

{
r.type === "waiter"
? "🧑‍🍳 Llamar mesero"
: `💵 Pedir cuenta ${
r.payment_method === "cash" ? "(Efectivo)" :
r.payment_method === "card" ? "(Tarjeta)" :
r.payment_method === "transfer" ? "(Transferencia)" :
""
}`
}

</p>

<p>

Estado: {r.status === "pending"
? "🔴 Pendiente"
: "🟢 Atendido"}

</p>

<p>
  ⏱ {r.status === "pending" ? "Esperando " : "Tiempo de atención "} {getResponseTime(r)}
</p>



{r.status === "pending" && (

<button
onClick={()=>attendRequest(r.id)}
style={{
padding:"14px 28px",
fontSize:"16px",
fontWeight:"bold",
background:"#22c55e",
border:"none",
borderRadius:"8px",
cursor:"pointer",
color:"white",
marginTop:"10px"
}}
>
✔ Marcar como atendido
</button>

)}

</div>

))}

</div>

)

}