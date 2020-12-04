require('dotenv/config');
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const db = new Pool({ connectionString: process.env.DB_URL });
const port = process.env.PORT;

const serverErr = err => ({ err });
const userErr = (msg = 'Invalid request', code = 400) => ({ code, msg });
const verify = (val, required = true, expected = null) => {
  if (!required && val == null) return null;
  if (required && val == null) return userErr('Missing required value');
  if (expected) {
    const err = expected(val);
    if (err) return userErr(`Expected ${err} but received ${val}`);
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
const isNum = val => {
  if (!isNaN(parseInt(val))) return null;
  return 'number';
}
const isPosNum = val => {
  if (!isNum(val) && val >= 0) return null;
  return 'positive number';
}

db.connect();

app.use(express.json());

app.use('/bootstrap', express.static(path.resolve(__dirname, '..', 'node_modules', 'bootstrap-icons', 'icons/')));

app.use(express.static(path.resolve(__dirname, '..', 'public/')));

app.get('/api/products/prices', (req, res, next) => {
  const { s: search = null } = req.query;
  db.query(`
    SELECT    MIN(price - discount),
              MAX(price - discount)
    FROM      products AS p
    LEFT JOIN tags AS t ON (t.pid = p.id)
    WHERE     $1::TEXT IS NULL
              OR p.name ~* $1::TEXT
              OR p.description ~* $1::TEXT
              OR t.name LIKE $1::TEXT;
  `, [search]).then(data => {
      let { min, max } = data.rows[0];
      min = Math.floor(min / 100);
      max = Math.ceil(max / 100);
      res.json({ min, max });
    }).catch(err => next({err}));
});

app.get('/api/products', (req, res, next) => {
  const limit = 25;
  let {
    deals: deals = false,
    s: search = null,
    min: min = null,
    max: max = null,
    offset: offset = 0,
  } = req.query;
  const err = verifyMultiple(
    [min, false, isPosNum],
    [max, false, isPosNum],
    [offset, false, isPosNum],
  );
  if (err) return next(err);
  deals = !!deals;
  if (!search) search = null;
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
                SELECT  JSON_BUILD_OBJECT(
                          'url', i.url,
                          'alt', i.alt
                        )
                FROM images AS i
                WHERE i.pid = p.id
                ORDER BY i.img_order,
                         i.id
                LIMIT 1
              ) AS img,
              COUNT(*) OVER() AS total_results
    FROM      products AS p
    LEFT JOIN tags AS t ON (t.pid = p.id)
    WHERE     ($1 = FALSE OR p.discount > 0)
              AND (
                $2::TEXT IS NULL
                OR p.name ~* $2::TEXT
                OR p.description ~* $2::TEXT
                OR t.name LIKE $2::TEXT
              )
              AND ($3::INTEGER IS NULL OR $3::INTEGER <= p.price - p.discount)
              AND ($4::INTEGER IS NULL OR $4::INTEGER >= p.price - p.discount)
    GROUP BY  p.id
    LIMIT     $5
    OFFSET    $6;
  `, [deals, search, min, max, limit, offset])
    .then(data => {
      res.json({
        meta: {
          search,
          limit,
          offset,
          totalResults: data.rows[0]?.['total_results']
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

app.get('/api/product', (req, res, next) => {
  let { id } = req.query;
  const err = verifyMultiple(
    [id, true, isPosNum]
  );
  if (err) return next(err);
  id = parseInt(id);
  db.query(`
    SELECT    p.*,
              JSON_AGG(
                JSON_BUILD_OBJECT(
                  'url', i.url,
                  'alt', i.alt
                )
                ORDER BY i.img_order
              ) AS images
    FROM      products AS p
    LEFT JOIN images AS i ON(i.pid = p.id)
    WHERE     p.id = $1
    GROUP BY  p.id;
  `, [id])
    .then(data => {
      const result = data.rows[0];
      result.price /= 100;
      result.discount /= 100;
      res.json(result);
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
