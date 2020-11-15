require('dotenv/config')
const express = require('express')
const { Pool } = require('pg')
const path = require('path')
const app = express()
const db = new Pool({ connectionString: process.env.DB_URL })
const port = process.env.PORT

db.connect()

app.use(express.json())

app.use(express.static(path.resolve(__dirname, '..', 'public/')))

app.get('/api/products', (req, res) => {
  db.query(`
    SELECT  p.*,
            (
              SELECT  ARRAY_AGG(url ORDER BY img_order, id) images
              FROM    images AS i
              WHERE   pid = p.id
            )
    FROM    products AS p
    WHERE   ($1 = TRUE AND featured = TRUE) OR $1 = FALSE;
  `, [!!req.query.featured])
    .then(data => res.json(data.rows))
    .catch(err => console.error(err))
})

app.listen(port, () => console.log(`Listening on port ${port}.`))
