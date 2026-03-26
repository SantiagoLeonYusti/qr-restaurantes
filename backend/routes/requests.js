const express = require("express")
const router = express.Router()
const pool = require("../db")

router.post("/waiter", async (req, res) => {

    const { table_id } = req.body

    const result = await pool.query(
        "INSERT INTO requests (table_id, type) VALUES ($1,'WAITER') RETURNING *",
        [table_id]
    )

    res.json(result.rows[0])

})

module.exports = router