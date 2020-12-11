require('dotenv/config');
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();
const db = new Pool({ connectionString: process.env.DB_URL });
const port = process.env.PORT;

const productLimit = 25;

const productSelect = table => {
  let _table = table || '';
  if (table) _table += '.';
  return `
    ${_table}id,
    ${_table}name,
    ${_table}price,
    ${_table}discount,
    (
      SELECT    JSON_BUILD_OBJECT(
                  'url', i.url,
                  'alt', i.alt
                )
      FROM      images AS i
      WHERE     i.pid = ${_table}id
      ORDER BY  i.img_order,
                i.id
      LIMIT     1
    ) AS img
  `;
};

const productSearchMatch = paramIndex => `
  $${paramIndex}::TEXT  IS    NULL
  OR p.name             ~*    $${paramIndex}::TEXT
  OR p.description      ~*    $${paramIndex}::TEXT
  OR t.name             LIKE  $${paramIndex}::TEXT
`;

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
    FROM      products  AS p
    LEFT JOIN tags      AS t ON t.pid = p.id
    WHERE     ${productSearchMatch(1)};
  `, [search]).then(data => {
      let { min, max } = data.rows[0];
      min = Math.floor(min / 100);
      max = Math.ceil(max / 100);
      res.json({ min, max });
    }).catch(err => next({err}));
});

app.get('/api/products/related', (req, res, next) => {
  let { id = null } = req.query;
  const err = verifyMultiple(
    [id, true, isPosNum]
  );
  if (err) return next(err);
  id = parseInt(id);
  db.query(`
    WITH products_cte AS (
      SELECT    ${productSelect('p')},
                ARRAY_AGG(t.name) AS tags
      FROM      products  AS p
      LEFT JOIN tags      AS t ON (t.pid = p.id)
      GROUP BY  p.id
    )
    SELECT  ${productSelect()}
    FROM    products_cte
    WHERE   tags && (
              SELECT tags
              FROM  products_cte
              WHERE id = $1
            )
            AND id != $1
    LIMIT   $2;
  `, [id, productLimit])
    .then(data => res.json({
      products: data.rows.map(row => {
        row.price /= 100;
        row.discount /= 100;
        return row;
      })
    })).catch(err => next({ err }));
});

app.get('/api/products', (req, res, next) => {
  let {
    deals = false,
    s: search = null,
    min = null,
    max = null,
    offset = 0,
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
    SELECT    ${productSelect('p')},
              (
                SELECT    p.description
                WHERE     $1 = FALSE
              ),
              COUNT(*) OVER() AS total_results
    FROM      products  AS p
    LEFT JOIN tags      AS t ON t.pid = p.id
    WHERE     (
                $1                =     FALSE
                OR p.discount     >     0
              )
              AND (
                ${productSearchMatch(2)}
              )
              AND (
                $3::INTEGER       IS    NULL
                OR $3::INTEGER    <=    p.price - p.discount
              )
              AND (
                $4::INTEGER       IS    NULL
                OR $4::INTEGER    >=    p.price - p.discount
              )
    GROUP BY  p.id
    LIMIT     $5
    OFFSET    $6;
  `, [deals, search, min, max, productLimit, offset])
    .then(data => {
      res.json({
        meta: {
          search,
          PRODUCT_LIMIT,
          offset,
          totalResults: data.rows[0]?.['total_results']
        },
        products: data.rows.map(row => {
          delete row['total_results'];
          row.price /= 100;
          row.discount /= 100;
          return row;
        })
      });
    }).catch(err => next({ err }));
});

app.get('/api/product', (req, res, next) => {
  let { id = null } = req.query;
  const err = verifyMultiple(
    [id, true, isPosNum]
  );
  if (err) return next(err);
  id = parseInt(id);
  db.query(`
    WITH      images_cte    AS (
      SELECT    JSON_AGG(
                  JSON_BUILD_OBJECT(
                    'url', url,
                    'alt', alt
                  )
                  ORDER BY img_order
                ) AS images,
                pid AS id
      FROM      images
      GROUP BY  pid
    ),        shipping_cte  AS (
      SELECT    ARRAY_AGG(
                  sm.name
                ) AS shipping_methods,
                s.pid AS id
      FROM      shipping AS s
      JOIN      shipping_methods AS sm ON sm.id = s.shipping_method
      GROUP BY  s.pid
    )
    SELECT    p.*,
              i.images,
              s.shipping_methods
    FROM      products      AS p
    LEFT JOIN images_cte    AS i USING(id)
    LEFT JOIN shipping_cte  AS s USING(id)
    WHERE     id = $1;
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
