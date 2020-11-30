require('dotenv/config');
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const db = new Pool({ connectionString: process.env.DB_URL });
const port = process.env.PORT;

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

app.get('/api/products/prices', (req, res, next) => {
  db.query(`
    SELECT  MIN(price - discount),
            MAX(price - discount)
    FROM    products;
  `).then(data => {
      let { min, max } = data.rows[0];
      min /= 100;
      max /= 100;
      res.json({ min, max });
    }).catch(err => next({err}));
});

app.get('/api/products', (req, res, next) => {
  let {
    deals: deals = false,
    limit: limit = null,
    offset: offset = null,
    s: search = null,
    min: min = null,
    max: max = null
  } = req.query;
  const err = verifyMultiple(
    [limit, false, val => isNumber(val) && val >= 0, 'positive integer'],
    [offset, false, val => isNumber(val) && val >= 0, 'positive integer'],
    [min, false, val => isNumber(val) && val >= 0, 'positive integer'],
    [max, false, val => isNumber(val) && val >= 0, 'positive integer']
  );
  if (err) return next(err);
  deals = !!deals;
  if (min) min = parseInt(min) * 100;
  if (max) max = parseInt(max) * 100;
  db.query(`
    SELECT    p.id,
              p.name,
              (
                SELECT  p.description
                WHERE   $1 = FALSE
              ),
              p.price,
              p.discount,
              (
                SELECT    i.url AS image_url
                FROM      images AS i
                WHERE     pid = p.id
                ORDER BY  i.img_order, i.id
                LIMIT     1
              ),
              COUNT(*) OVER() AS total_results
    FROM      products AS p
    LEFT JOIN tags AS t ON (t.pid = p.id)
    WHERE     ($1 = FALSE OR p.discount > 0)
              AND (
                $4::TEXT IS NULL
                OR $4::TEXT ~ p.name
                OR $4::TEXT ~ p.description
                OR $4::TEXT LIKE t.name
              )
              AND ($5::INTEGER IS NULL OR $5::INTEGER <= p.price - p.discount)
              AND ($6::INTEGER IS NULL OR $6::INTEGER >= p.price - p.discount)
    GROUP BY  p.id
    LIMIT     $2::INTEGER
    OFFSET    $3::INTEGER;
  `, [deals, limit, offset, search, min, max])
    .then(data => {
      res.json({
        meta: {
          search,
          limit: limit || 0,
          offset: offset || 0,
          totalResults: data.rows[0]?.['total_results'] || 0
        },
        products: data.rows.map(data => {
          delete data['total_results'];
          data.price /= 100;
          data.discount /= 100;
          return data;
        })
      });
    }).catch(err => next({ err }));
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
