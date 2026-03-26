import { useEffect,useState } from "react"
import axios from "axios"

export default function History(){

const [requests,setRequests] = useState([])
const [selectedDate,setSelectedDate] = useState("")


// 🔥 TIEMPO DE ATENCIÓN
const getResponseTime = (r) => {

  if(!r.updated_at) return "En proceso"

  const start = new Date(r.created_at)
  const end = new Date(r.updated_at)

  const diffSec = Math.floor((end - start)/1000)
  const minutes = Math.floor(diffSec / 60)
  const seconds = diffSec % 60

  return `${minutes}m ${seconds}s`
}


// 🔥 CARGAR HISTORIAL
const loadHistory = async()=>{

  const restaurant = localStorage.getItem("restaurant_id")

  try{

    const res = await axios.get(
      "http://localhost:3000/requests/history/"+restaurant
    )

    setRequests(res.data)

  }catch(e){
    console.log("Error cargando historial")
  }

}


useEffect(()=>{
  loadHistory()
},[])


// 🔥 FILTRAR POR FECHA
const filteredRequests = requests.filter(r => {

  if(!selectedDate) return true

  const requestDate = new Date(r.created_at)

  const localDate =
    requestDate.getFullYear() + "-" +
    String(requestDate.getMonth()+1).padStart(2,"0") + "-" +
    String(requestDate.getDate()).padStart(2,"0")

  return localDate === selectedDate

})


return(

<div style={{
  padding:"40px",
  background:"#111827",
  minHeight:"100vh",
  color:"white",
  fontFamily:"Arial"
}}>

<h1 style={{marginBottom:"20px"}}>
📜 Historial de solicitudes
</h1>


{/* 🔥 FILTRO POR FECHA */}

<div style={{
  background:"#1f2937",
  padding:"20px",
  borderRadius:"12px",
  marginBottom:"25px"
}}>

<h3>📅 Filtrar por fecha</h3>

<input
  type="date"
  value={selectedDate}
  onChange={(e)=>setSelectedDate(e.target.value)}
  style={{
    padding:"10px",
    borderRadius:"6px",
    border:"none",
    marginRight:"10px"
  }}
/>

<button
  onClick={()=>setSelectedDate("")}
  style={{
    padding:"10px 15px",
    background:"#ef4444",
    border:"none",
    borderRadius:"6px",
    color:"white",
    cursor:"pointer"
  }}
>
Limpiar filtro
</button>

</div>



{/* SIN RESULTADOS */}

{filteredRequests.length === 0 && (
  <p>No hay solicitudes para esta fecha</p>
)}



{/* LISTA */}

{filteredRequests.map(r=>(

<div key={r.id} style={{
  background:"#1f2937",
  borderRadius:"12px",
  padding:"20px",
  marginBottom:"15px",
  boxShadow:"0 4px 10px rgba(0,0,0,0.4)"
}}>

<h3>
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
🕒 Hora: {new Date(r.created_at).toLocaleString()}
</p>

<p>
⏱ Tiempo: {getResponseTime(r)}
</p>

</div>

))}

</div>

)

}