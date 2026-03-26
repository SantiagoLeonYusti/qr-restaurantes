const { Pool } = require('pg')

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "restaurant_qr",
    password: "agatha23",
    port: 5432
})

module.exports = pool