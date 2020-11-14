require('dotenv/config')
const express = require('express')
const { Pool } = require('pg')
const app = express()
const db = new Pool({ connectionString: process.env.DB_URL })
const port = process.env.PORT

db.connect()

app.use(express.json())

app.get('/api', (req, res) => res.json({a:123}))

app.listen(port, () => console.log(`Listening on port ${port}.`))
