const express = require("express")
const cors = require("cors")
const { Pool } = require("pg")
const QRCode = require("qrcode")
const http = require("http")
const { Server } = require("socket.io")
const PDFDocument = require("pdfkit")
const bcrypt = require("bcrypt")
const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({

destination:(req,file,cb)=>{
cb(null,"menus/")
},

filename:(req,file,cb)=>{
cb(null, Date.now()+path.extname(file.originalname))
}

})

const upload = multer({storage})

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(__dirname))
app.use("/menus", express.static("menus"))

const server = http.createServer(app)

const io = new Server(server,{
cors:{origin:"*"}
})

require("dotenv").config()

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

const pool = require("./db")

pool.query("SELECT NOW()")
  .then(res => console.log("✅ DB conectada:", res.rows))
  .catch(err => console.error("❌ Error DB:", err))

app.post("/auth/login", async(req,res)=>{

const {email,password} = req.body

// ADMIN
const restaurant = await pool.query(
`SELECT * FROM restaurants WHERE email=$1`,
[email]
)

if(restaurant.rows.length > 0){

const admin = restaurant.rows[0]

const valid = await bcrypt.compare(password,admin.password)

if(!valid){
return res.status(401).json({error:"Password incorrecto"})
}

// 🚨 VALIDAR SUSCRIPCIÓN
if(admin.subscription_status !== "active"){
return res.status(403).json({
error:"Suscripción inactiva"
})
}

if(new Date(admin.subscription_end) < new Date()){
return res.status(403).json({
error:"Suscripción vencida"
})
}

return res.json({
id:admin.id,
name:admin.name,
role:"admin"
})

}


// STAFF
const user = await pool.query(
`SELECT * FROM users WHERE email=$1`,
[email]
)

if(user.rows.length === 0){
return res.status(401).json({error:"Usuario no existe"})
}

const staff = user.rows[0]

const valid = await bcrypt.compare(password,staff.password)

if(!valid){
return res.status(401).json({error:"Password incorrecto"})
}

// 🚨 VALIDAR SUSCRIPCIÓN DEL RESTAURANTE
const restaurantCheck = await pool.query(
`SELECT subscription_status,subscription_end 
FROM restaurants 
WHERE id=$1`,
[staff.restaurant_id]
)

const r = restaurantCheck.rows[0]

if(!r || r.subscription_status !== "active"){
return res.status(403).json({
error:"Suscripción inactiva"
})
}

if(new Date(r.subscription_end) < new Date()){
return res.status(403).json({
error:"Suscripción vencida"
})
}

res.json({
id:staff.restaurant_id,
name:staff.name,
role:staff.role
})

})


/* SOCKET.IO */

io.on("connection",(socket)=>{
console.log("Cliente conectado",socket.id)
socket.on("joinRestaurant",(restaurantId)=>{
const room = "restaurant_"+restaurantId
socket.join(room)
console.log("Socket unido a",room)
})
socket.on("disconnect",()=>{
console.log("Cliente desconectado",socket.id)
})
})

/* =========================
   🔐 MIDDLEWARE SUSCRIPCIÓN
========================= */

const checkSubscription = async (req,res,next)=>{

const restaurantId =
req.params.restaurant_id ||
req.body.restaurant_id ||
req.query.restaurant_id

if(!restaurantId) return next()

const result = await pool.query(
`SELECT subscription_status,subscription_end
FROM restaurants
WHERE id=$1`,
[restaurantId]
)

const r = result.rows[0]

if(!r){
return res.status(404).json({error:"Restaurante no existe"})
}

if(r.subscription_status !== "active"){
return res.status(403).json({error:"Suscripción inactiva"})
}

if(new Date(r.subscription_end) < new Date()){
return res.status(403).json({error:"Suscripción vencida"})
}

next()

}


/* CREAR MESA */

app.post("/tables/create", async(req,res)=>{

const {restaurant_id,table_number} = req.body

//const url = `http://localhost:5173/table/${table_number}`
const url = `https://TU_APP.vercel.app/table/${table_number}`

const qr = await QRCode.toDataURL(url)

const result = await pool.query(
`INSERT INTO tables (restaurant_id,table_number,qr_code)
VALUES ($1,$2,$3)
RETURNING *`,
[restaurant_id,table_number,qr]
)

res.json(result.rows[0])

})


/* LLAMAR MESERO */

app.post("/requests/waiter", async(req,res)=>{

const {restaurant_id,table_number} = req.body

const table = await pool.query(
`SELECT id,table_number
FROM tables
WHERE table_number=$1
AND restaurant_id=$2`,
[table_number,restaurant_id]
)

if(table.rows.length === 0){
return res.status(404).json({error:"Mesa no encontrada"})
}

const tableId = table.rows[0].id

const result = await pool.query(
`INSERT INTO requests(table_id,type,status)
VALUES($1,'waiter','pending')
RETURNING *`,
[tableId]
)

const data = {
...result.rows[0],
table_number: table.rows[0].table_number
}

io.to("restaurant_"+restaurant_id).emit("newRequest",data)

res.json(data)

})


/* PEDIR CUENTA */

app.post("/requests/bill", async(req,res)=>{

const {restaurant_id,table_number,payment_method} = req.body

const table = await pool.query(
`SELECT id,table_number
FROM tables
WHERE table_number=$1
AND restaurant_id=$2`,
[table_number,restaurant_id]
)

if(table.rows.length === 0){
return res.status(404).json({error:"Mesa no encontrada"})
}

const tableId = table.rows[0].id

const result = await pool.query(
`INSERT INTO requests(table_id,type,status,payment_method)
VALUES($1,'bill','pending',$2)
RETURNING *`,
[tableId,payment_method]
)

const data = {
...result.rows[0],
table_number: table_number
}

io.to("restaurant_"+restaurant_id).emit("newRequest",data)

res.json(data)

})


/* LISTAR MESAS */

app.get("/tables/:restaurant_id", async(req,res)=>{

const {restaurant_id} = req.params

const result = await pool.query(
`SELECT * FROM tables WHERE restaurant_id=$1 ORDER BY table_number`,
[restaurant_id]
)

res.json(result.rows)

})


/* GENERAR VARIAS MESAS */

app.post("/tables/generate", async(req,res)=>{

const {restaurant_id,total_tables} = req.body

const lastTable = await pool.query(
`SELECT MAX(table_number) as max 
 FROM tables 
 WHERE restaurant_id = $1`,
[restaurant_id]
)

let start = lastTable.rows[0].max || 0

let tables = []

for(let i=1;i<=total_tables;i++){

let tableNumber = start + i

const url = `http://localhost:5173/table/${tableNumber}`

const qr = await QRCode.toDataURL(url)

const result = await pool.query(
`INSERT INTO tables (restaurant_id,table_number,qr_code)
VALUES ($1,$2,$3)
RETURNING *`,
[restaurant_id,tableNumber,qr]
)

tables.push(result.rows[0])

}

res.json(tables)

})

/* ---------------------------
   PDF QRs
---------------------------- */

app.get("/tables/qr-pdf/:restaurant_id", async (req, res) => {
  const { restaurant_id } = req.params;
  const result = await pool.query(
    "SELECT * FROM tables WHERE restaurant_id=$1 ORDER BY table_number",
    [restaurant_id]
  );
  const tables = result.rows;
  const doc = new PDFDocument();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=qr_mesas.pdf");
  doc.pipe(res);

  tables.forEach(table => {
    doc.fontSize(20).text(`Mesa ${table.table_number}`, { align: "center" });
    const base64 = table.qr_code.replace(/^data:image\/png;base64,/, "");
    const imgBuffer = Buffer.from(base64, "base64");
    doc.image(imgBuffer, { fit: [200, 200], align: "center" });
    doc.moveDown(2);
  });

  doc.end();
});

/* REGISTRO RESTAURANTE */

app.post("/auth/login", async(req,res)=>{

const {email,password} = req.body

// ADMIN
const restaurant = await pool.query(
`SELECT * FROM restaurants WHERE email=$1`,
[email]
)

if(restaurant.rows.length > 0){

const admin = restaurant.rows[0]

const valid = await bcrypt.compare(password,admin.password)

if(!valid){
return res.status(401).json({error:"Password incorrecto"})
}

// 🚨 VALIDAR SUSCRIPCIÓN
if(admin.subscription_status !== "active"){
return res.status(403).json({
error:"Suscripción inactiva"
})
}

if(new Date(admin.subscription_end) < new Date()){
return res.status(403).json({
error:"Suscripción vencida"
})
}

return res.json({
id:admin.id,
name:admin.name,
role:"admin"
})

}


// STAFF
const user = await pool.query(
`SELECT * FROM users WHERE email=$1`,
[email]
)

if(user.rows.length === 0){
return res.status(401).json({error:"Usuario no existe"})
}

const staff = user.rows[0]

const valid = await bcrypt.compare(password,staff.password)

if(!valid){
return res.status(401).json({error:"Password incorrecto"})
}

// 🚨 VALIDAR SUSCRIPCIÓN DEL RESTAURANTE
const restaurantCheck = await pool.query(
`SELECT subscription_status,subscription_end 
FROM restaurants 
WHERE id=$1`,
[staff.restaurant_id]
)

const r = restaurantCheck.rows[0]

if(!r || r.subscription_status !== "active"){
return res.status(403).json({
error:"Suscripción inactiva"
})
}

if(new Date(r.subscription_end) < new Date()){
return res.status(403).json({
error:"Suscripción vencida"
})
}

res.json({
id:staff.restaurant_id,
name:staff.name,
role:staff.role
})

})


/* LOGIN */

app.post("/auth/login", async(req,res)=>{

const {email,password} = req.body

const restaurant = await pool.query(
`SELECT * FROM restaurants WHERE email=$1`,
[email]
)

if(restaurant.rows.length > 0){

const admin = restaurant.rows[0]

const valid = await bcrypt.compare(password,admin.password)

if(!valid){
return res.status(401).json({error:"Password incorrecto"})
}

return res.json({
id:admin.id,
name:admin.name,
role:"admin"
})

}

const user = await pool.query(
`SELECT * FROM users WHERE email=$1`,
[email]
)

if(user.rows.length === 0){
return res.status(401).json({error:"Usuario no existe"})
}

const staff = user.rows[0]

const valid = await bcrypt.compare(password,staff.password)

if(!valid){
return res.status(401).json({error:"Password incorrecto"})
}

res.json({
id:staff.restaurant_id,
name:staff.name,
role:staff.role
})

})


/* MARCAR ATENDIDO (CORREGIDO SOCKET) */

app.post("/requests/attended", async(req,res)=>{

const {id} = req.body

await pool.query(
`UPDATE requests 
SET status='attended',
updated_at=NOW()
WHERE id=$1`,
[id]
)

const result = await pool.query(`
SELECT t.restaurant_id
FROM requests r
JOIN tables t ON r.table_id = t.id
WHERE r.id = $1
`,[id])

if(result.rows.length > 0){

const restaurantId = result.rows[0].restaurant_id

io.to("restaurant_"+restaurantId).emit("requestUpdated",id)

}

res.json({success:true})

})


/* HISTORIAL */

app.get("/requests/history/:restaurant_id", async(req,res)=>{
  const {restaurant_id} = req.params
  const result = await pool.query(`
    SELECT 
      r.*,
      t.table_number
    FROM requests r
    JOIN tables t ON r.table_id = t.id
    WHERE t.restaurant_id = $1
    ORDER BY r.created_at DESC
  `,[restaurant_id])

  // Agregar tiempo de atención
  const requestsWithTime = result.rows.map(r => {
    let duration = null
    if(r.updated_at) {
      const start = new Date(r.created_at)
      const end = new Date(r.updated_at)
      const diffMs = end - start // diferencia en milisegundos
      const diffSec = Math.floor(diffMs / 1000)
      const minutes = Math.floor(diffSec / 60)
      const seconds = diffSec % 60
      duration = `${minutes}m ${seconds}s`
    }
    return {...r, duration}
  })

  res.json(requestsWithTime)
})


/* SUBIR MENU */

app.post("/menu/upload/:restaurant_id", upload.single("menu"), async(req,res)=>{

const {restaurant_id} = req.params

const menuPath = "/menus/" + req.file.filename

await pool.query(
`UPDATE restaurants SET menu_url=$1 WHERE id=$2`,
[menuPath,restaurant_id]
)

res.json({
message:"Menu subido",
url:menuPath
})

})


/* OBTENER MENU */

app.get("/menu/:restaurant_id", async(req,res)=>{

const {restaurant_id} = req.params

const result = await pool.query(
`SELECT menu_url FROM restaurants WHERE id=$1`,
[restaurant_id]
)

res.json(result.rows[0])

})


/* ELIMINAR MESA */

app.delete("/tables/:id", async(req,res)=>{

const {id} = req.params

await pool.query(
`DELETE FROM tables WHERE id=$1`,
[id]
)

res.json({success:true})

})


/* EDITAR MESA */

app.put("/tables/:id", async(req,res)=>{

const {id} = req.params
const {table_number} = req.body

//const url = `http://localhost:5173/table/${table_number}`
const url = `https://TU_APP.vercel.app/table/${table_number}`

const qr = await QRCode.toDataURL(url)

const result = await pool.query(
`UPDATE tables
SET table_number=$1, qr_code=$2
WHERE id=$3
RETURNING *`,
[table_number,qr,id]
)

res.json(result.rows[0])

})


/* SOLICITUDES PENDIENTES */

app.get("/requests/pending/:restaurant_id", async(req,res)=>{

const {restaurant_id} = req.params

const result = await pool.query(`
SELECT r.*, t.table_number
FROM requests r
JOIN tables t ON r.table_id = t.id
WHERE t.restaurant_id=$1
AND r.status='pending'
ORDER BY r.created_at DESC
`,[restaurant_id])

res.json(result.rows)

})


/* CREAR USUARIOS STAFF */

app.post("/users/create", async(req,res)=>{

const {restaurant_id,name,email,password,role} = req.body

const hash = await bcrypt.hash(password,10)

const result = await pool.query(

`INSERT INTO users(restaurant_id,name,email,password,role)
VALUES($1,$2,$3,$4,$5)
RETURNING id,name,email,role`,

[restaurant_id,name,email,hash,role]

)

res.json(result.rows[0])

})

app.get("/users/:restaurant_id", async(req,res)=>{

const {restaurant_id} = req.params

const result = await pool.query(
`SELECT id,name,email,role
FROM users
WHERE restaurant_id=$1`,
[restaurant_id]
)

res.json(result.rows)

})

app.delete("/users/:id", async(req,res)=>{

const {id} = req.params

await pool.query(
`DELETE FROM users WHERE id=$1`,
[id]
)

res.json({success:true})

})

app.get("/tables/by-number/:table_number", async(req,res)=>{

const {table_number} = req.params

const result = await pool.query(
`SELECT restaurant_id 
FROM tables 
WHERE table_number=$1`,
[table_number]
)

if(result.rows.length === 0){
return res.status(404).json({error:"Mesa no encontrada"})
}

res.json(result.rows[0])

})

server.listen(process.env.PORT || 3000,()=>{
console.log("Servidor corriendo")
})