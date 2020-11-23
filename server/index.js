require('dotenv/config')
const express = require('express')
const { Pool } = require('pg')
const path = require('path')
const app = express()
const db = new Pool({ connectionString: process.env.DB_URL })
const port = process.env.PORT

db.connect()

app.use(express.json())

app.use('/bootstrap', express.static(path.resolve(__dirname, '..', 'node_modules', 'bootstrap-icons', 'icons/')))

app.use(express.static(path.resolve(__dirname, '..', 'public/')))

// SELECT  ARRAY_AGG(url ORDER BY img_order, id) images
// FROM    images AS i
// WHERE   pid = p.id

app.get('/api/products', (req, res, next) => {
  db.query(`
    SELECT  p.id,
            p.name,
            (
              SELECT  p.description
              WHERE   $1 = FALSE
            ),
            p.price,
            p.discount,
            (
              SELECT    url AS image_url
              FROM      images AS i
              WHERE     pid = p.id
              ORDER BY  img_order, id
              LIMIT     1
            )
    FROM    products AS p
    WHERE   $1 = FALSE OR ($1 = TRUE AND discount > 0);
  `, [!!req.query.deals])
    .then(data => res.json(data.rows))
    .catch(err => next({ err }))
})

app.use((error, req, res, next) => {
  const {
    err: err = null,
    code: code = 500,
    msg: msg = 'An unexpected error has occurred.'
  } = error
  console.error('error:', err)
  res.status(code).json({ code, msg })
})

app.listen(port, () => console.log(`Listening on port ${port}.`))
