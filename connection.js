const mysql = require('mysql2')
const dotenv = require('dotenv')
dotenv.config()
const varenv = process.env

const db = mysql.createConnection({
    host: varenv.DB_HOST,
    user: varenv.DB_USER,
    password: varenv.DB_PASS,
    database: varenv.DB_NAME
})

module.exports = db