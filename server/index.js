require('dotenv/config')
const express = require('express')
const { Pool } = require('pg')
const path = require('path')
const app = express()
const db = new Pool({ connectionString: process.env.DB_URL })
const port = process.env.PORT

const serverErr = err => ({ err });
const userErr = (msg = 'Invalid request', code = 400) => ({ code, msg });
const verify = (val, required = true, expected = null, expectedVal = '') => {
  if (!required && val == null) return null;
  if (required && val == null) return userErr('Missing required value');
  if (expected) {
    if (!expectedVal) console.error(`Missing expected message for ${expected.toString()}`);
    if (!expected(val)) return userErr(`Expected ${expectedVal || 'correct value'} but received ${val}`);
  }
  return null;
};
const verifyMultiple = (...vals) => {
  let err = null;
  for(const val of vals) {
    err = verify(...val);
    if (err) break;
  }
  return err;
};
const isNumber = val => !isNaN(parseInt(val));

db.connect();

app.use(express.json());

app.use('/bootstrap', express.static(path.resolve(__dirname, '..', 'node_modules', 'bootstrap-icons', 'icons/')));

app.use(express.static(path.resolve(__dirname, '..', 'public/')));

// SELECT  ARRAY_AGG(url ORDER BY img_order, id) images
// FROM    images AS i
// WHERE   pid = p.id

app.get('/api/products', (req, res, next) => {
  let {
    deals: deals = false,
    min: min = null,
    max: max = null
  } = req.query;
  const err = verifyMultiple(
    [min, false, val => isNumber(val) && val >= 0, 'positive integer'],
    [max, false, val => isNumber(val) && val >= 0, 'positive integer']
  );
  if (err) return next(err);
  deals = !!deals;
  if (min) min = parseInt(min);
  if (max) max = parseInt(max);
  db.query(`
    SELECT  p.id,
            name,
            (
              SELECT  p.description
              WHERE   $1 = FALSE
            ),
            price,
            discount,
            (
              SELECT    url AS image_url
              FROM      images AS i
              WHERE     pid = p.id
              ORDER BY  img_order, id
              LIMIT     1
            )
    FROM    products AS p
    WHERE   ($1 = FALSE OR discount > 0)
            AND ($2::INTEGER IS NULL OR price - discount >= $2::INTEGER)
            AND ($3::INTEGER IS NULL OR price - discount <= $3::INTEGER);
  `, [deals, min, max])
    .then(data => res.json(data.rows))
    .catch(err => next({ err }));
});

app.use((error, req, res, next) => {
  const {
    err: err = null,
    code: code = 500,
    msg: msg = 'An unexpected error has occurred.'
  } = error;
  if (err) console.error(err);
  res.status(code).json({ code, msg });
});

app.listen(port, () => console.log(`Listening on port ${port}.`));
