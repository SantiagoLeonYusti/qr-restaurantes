const express = require("express")
const router = express.Router()
const pool = require("../db")
const QRCode = require("qrcode")

router.post("/create", async (req, res) => {

    const { restaurant_id, table_number } = req.body

    const url = `http://localhost:5173/table/${table_number}`

    const qr = await QRCode.toDataURL(url)

    const result = await pool.query(
        "INSERT INTO tables (restaurant_id, table_number, qr_code) VALUES ($1,$2,$3) RETURNING *",
        [restaurant_id, table_number, qr]
    )

    res.json(result.rows[0])

})

module.exports = router