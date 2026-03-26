import { useState,useEffect } from "react"
import axios from "axios"

export default function Admin(){

const [tables,setTables] = useState([])
const [users,setUsers] = useState([])
const [total,setTotal] = useState(0)
const [menuUrl,setMenuUrl] = useState(null)

const [name,setName] = useState("")
const [email,setEmail] = useState("")
const [password,setPassword] = useState("")

const restaurantId = localStorage.getItem("restaurant_id")


/* LOGOUT */

const logout = () => {

localStorage.removeItem("restaurant_id")
localStorage.removeItem("role")

window.location.href="/login"

}


/* ABRIR DASHBOARD */

const openDashboard = ()=>{
window.open("/dashboard","_blank")
}


/* CARGAR MESEROS */

const loadUsers = async ()=>{

try{

const res = await axios.get(
"http://localhost:3000/users/"+restaurantId
)

setUsers(res.data)

}catch(e){

console.log("Error cargando usuarios")

}

}


/* ELIMINAR MESERO */

const deleteUser = async(id)=>{

if(!window.confirm("Eliminar este mesero?")) return

await axios.delete(
"http://localhost:3000/users/"+id
)

loadUsers()

}


/* CARGAR MENÚ */

const loadMenu = async ()=>{

try{

const res = await axios.get(
"http://localhost:3000/menu/"+restaurantId
)

setMenuUrl(res.data.menu_url)

}catch(e){

setMenuUrl(null)

}

}


/* CARGAR MESAS */

const loadTables = async ()=>{

try{

const res = await axios.get(
"http://localhost:3000/tables/"+restaurantId
)

setTables(res.data)

}catch(e){

alert("Error cargando mesas")

}

}


/* CREAR MESERO */

const createUser = async ()=>{

if(!name || !email || !password){
alert("Completa todos los campos")
return
}

await axios.post(
"http://localhost:3000/users/create",
{
restaurant_id:restaurantId,
name,
email,
password,
role:"staff"
}
)

alert("Mesero creado correctamente")

setName("")
setEmail("")
setPassword("")

loadUsers()

}


/* ELIMINAR MESA */

const deleteTable = async(id)=>{

if(!window.confirm("Eliminar mesa?")) return

await axios.delete(
"http://localhost:3000/tables/"+id

)

loadTables()

}


/* RENOMBRAR MESA */

const renameTable = async(id)=>{

const newNumber = prompt("Nuevo número de mesa")

if(!newNumber) return

await axios.put(
"http://localhost:3000/tables/"+id,
{table_number:newNumber}
)

loadTables()

}


/* SUBIR MENÚ */

const uploadMenu = async(e)=>{

const file = e.target.files[0]

if(!file) return

const formData = new FormData()

formData.append("menu",file)

await axios.post(
"http://localhost:3000/menu/upload/"+restaurantId,
formData
)

alert("Menú subido correctamente")

loadMenu()

}


/* GENERAR MESAS */

const generateTables = async ()=>{

if(!total){
alert("Ingrese cantidad de mesas")
return
}

await axios.post(
"http://localhost:3000/tables/generate",
{
restaurant_id:restaurantId,
total_tables:total
}
)

loadTables()

}


/* DESCARGAR QR */

const downloadQR = () => {
  window.open(`http://localhost:3000/tables/qr-pdf/${restaurantId}`);
}


/* LOAD */

useEffect(()=>{

loadTables()
loadMenu()
loadUsers()

},[])



return(

<div style={{
padding:"50px",
background:"#111827",
minHeight:"100vh",
color:"white",
fontFamily:"Arial"
}}>


{/* HEADER */}

<div style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
marginBottom:"40px"
}}>

<h1 style={{
fontSize:"32px",
letterSpacing:"1px"
}}>
⚙ Panel de Administración
</h1>

<div>

<button
onClick={openDashboard}
style={{
background:"#22c55e",
color:"white",
border:"none",
padding:"12px 22px",
borderRadius:"8px",
cursor:"pointer",
marginRight:"10px",
fontWeight:"bold"
}}
>

📊 Dashboard

</button>

<button
onClick={logout}
style={{
background:"#ef4444",
color:"white",
border:"none",
padding:"12px 22px",
borderRadius:"8px",
cursor:"pointer",
fontWeight:"bold"
}}
>

🚪 Cerrar sesión

</button>

</div>

</div>



{/* CREAR MESERO */}

<div style={{
background:"#1f2937",
padding:"25px",
borderRadius:"12px",
marginBottom:"30px"
}}>

<h2 style={{marginBottom:"20px"}}>👨‍🍳 Crear mesero</h2>

<div style={{display:"flex",gap:"10px",flexWrap:"wrap"}}>

<input
placeholder="Nombre"
value={name}
onChange={(e)=>setName(e.target.value)}
style={{padding:"10px",borderRadius:"6px",border:"none"}}
/>

<input
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
style={{padding:"10px",borderRadius:"6px",border:"none"}}
/>

<input
type="password"
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
style={{padding:"10px",borderRadius:"6px",border:"none"}}
/>

<button
onClick={createUser}
style={{
background:"#3b82f6",
color:"white",
border:"none",
padding:"10px 20px",
borderRadius:"6px",
cursor:"pointer",
fontWeight:"bold"
}}
>

Crear

</button>

</div>

</div>



{/* LISTA MESEROS */}

<div style={{
background:"#1f2937",
padding:"25px",
borderRadius:"12px",
marginBottom:"30px"
}}>

<h2 style={{marginBottom:"20px"}}>👨‍🍳 Meseros</h2>

{users.length === 0 && <p>No hay meseros creados</p>}

{users.map(u=>(

<div key={u.id} style={{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
background:"#374151",
padding:"10px 15px",
borderRadius:"8px",
marginBottom:"10px"
}}>

<div>

<strong>{u.name}</strong>

<p style={{margin:0,fontSize:"14px"}}>
{u.email}
</p>

</div>

<button
onClick={()=>deleteUser(u.id)}
style={{
background:"#ef4444",
border:"none",
color:"white",
padding:"6px 14px",
borderRadius:"6px",
cursor:"pointer"
}}
>

Eliminar

</button>

</div>

))}

</div>



{/* GENERAR MESAS */}

<div style={{
background:"#1f2937",
padding:"25px",
borderRadius:"12px",
marginBottom:"30px"
}}>

<h2>Generar mesas</h2>

<input
type="number"
placeholder="Cantidad"
onChange={(e)=>setTotal(parseInt(e.target.value))}
style={{padding:"10px",marginRight:"10px"}}
/>

<button
onClick={generateTables}
style={{
background:"#22c55e",
border:"none",
padding:"10px 20px",
borderRadius:"6px",
color:"white"
}}
>

Generar

</button>

</div>



{/* MENÚ */}

<div style={{
background:"#1f2937",
padding:"25px",
borderRadius:"12px",
marginBottom:"30px"
}}>

<h2>Menú del restaurante</h2>

{menuUrl && (

<button
onClick={()=>
window.open(
"http://localhost:3000"+menuUrl+"?v="+Date.now()
)
}
style={{
padding:"10px 20px",
background:"#3b82f6",
border:"none",
borderRadius:"6px",
color:"white",
marginBottom:"10px"
}}
>

Ver menú

</button>

)}

<br/>

<input
type="file"
accept="application/pdf"
onChange={uploadMenu}
/>

</div>



{/* QR */}

<div style={{
background:"#1f2937",
padding:"25px",
borderRadius:"12px",
marginBottom:"30px"
}}>

<h2>QR Mesas</h2>

<button
onClick={downloadQR}
style={{
padding:"10px 20px",
background:"#3b82f6",
border:"none",
borderRadius:"6px",
color:"white",
marginRight:"10px"
}}
>

Descargar PDF

</button>

<button
onClick={()=>window.location="/history"}
style={{
padding:"10px 20px"
}}
>

Historial

</button>

</div>



{/* MESAS */}

<h2 style={{marginBottom:"20px"}}>Mesas</h2>

<div style={{
display:"grid",
gridTemplateColumns:"repeat(auto-fill,250px)",
gap:"20px"
}}>

{tables.map(t=>(

<div
key={t.id}
style={{
background:"#1f2937",
padding:"20px",
borderRadius:"12px",
textAlign:"center"
}}
>

<h3>Mesa {t.table_number}</h3>

<img
src={t.qr_code}
width="150"
/>

<br/><br/>

<button
onClick={()=>renameTable(t.id)}
style={{
padding:"6px 12px",
marginRight:"10px"
}}
>

Renombrar

</button>

<button
onClick={()=>deleteTable(t.id)}
style={{
padding:"6px 12px",
background:"#ef4444",
border:"none",
color:"white"
}}
>

Eliminar

</button>

</div>

))}

</div>

</div>

)

}