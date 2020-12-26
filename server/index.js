require('dotenv/config');
const {
  NODE_ENV: nodeEnv,
  PORT: port,
  DB_URL: dbUrl,
  SESSION_SECRET: sessionSecret,
  SESSION_EXPIRY: sessionExpiry
} = process.env;
const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);
const redisClient = redis.createClient();
const app = express();
const db = new Pool({ connectionString: dbUrl });
const productLimit = 25;
const productSelect = (alias = '') => {
  if (alias) alias += '.';
  return `
    ${alias}id,
    ${alias}name,
    ${alias}price,
    ${alias}discount,
    (
      SELECT    JSON_BUILD_OBJECT(
                  'url', i.url,
                  'alt', i.alt
                )
      FROM      images AS i
      WHERE     i.pid = ${alias}id
      ORDER BY  i.img_order,
                i.id
      LIMIT     1
    ) AS img
  `;
};
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
const isNum = val => isNaN(parseInt(val)) ? 'number' : null;

const isPosNum = val => isNum(val) || val < 0 ? 'positive number' : null;

const isValidRating = val => val < 1 || val > 10 ? 'valid rating' : null;

db.connect();

app.use(
  session({
    secret: sessionSecret,
    resave: false,
    rolling: true,
    saveUninitialized: false,
    store: new RedisStore({ client: redisClient }),
    cookie: {
      sameSite: true,
      httpOnly: nodeEnv === 'production',
      maxAge: parseInt(sessionExpiry),
    },
  })
);

app.use(express.json());

// temporary middleware for forcing an existing user id
app.use((req, res, next) => {
  req.session.uid = 1;
  next();
});

app.use('/bootstrap', express.static(path.resolve(__dirname, '..', 'node_modules', 'bootstrap-icons', 'icons/')));

app.use(express.static(path.resolve(__dirname, '..', 'public/')));

app.use((req, res, next) => {
  const { uid, cid } = req.session;
  if (uid == null || cid != null) return next();
  db.query(`
    WITH  carts_cte_sel AS (
      SELECT  id,
              uid,
              checked_out
      FROM    carts
      WHERE   uid = $1 AND NOT checked_out
      LIMIT   1
    ),    carts_cte_ins AS (
      INSERT INTO carts(uid)
      SELECT      $1
      WHERE       NOT EXISTS(
        SELECT  1
        FROM    carts_cte_sel
      )
      RETURNING   id
    )
    SELECT    id AS cid
    FROM      carts_cte_sel
    FULL JOIN carts_cte_ins USING(id);
  `, [uid])
    .then(data => {
      const { cid } = data.rows[0];
      req.session.cid = cid;
      next();
    }).catch(err => next({ err }));
});

app.get('/api/products/prices', (req, res, next) => {
  const { s: search = null } = req.query;
  db.query(`
    SELECT    MIN(price - discount),
              MAX(price - discount)
    FROM      products  AS p
    LEFT JOIN tags      AS t ON t.pid = p.id
    WHERE     $1::TEXT          IS    NULL
              OR p.name         ~*    $1::TEXT
              OR p.description  ~*    $1::TEXT
              OR t.name         LIKE  $1::TEXT;
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
    [id, true, isPosNum],
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
                $2::TEXT          IS    NULL
                OR p.name         ~*    $2::TEXT
                OR p.description  ~*    $2::TEXT
                OR t.name         LIKE  $2::TEXT
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
          limit: productLimit,
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

app.put('/api/product/rating', (req, res, next) => {
  const { uid = null } = req.session;
  const { id, rating } = req.body;
  let err = verifyMultiple(
    [id, true, isPosNum],
    [rating, true, isValidRating],
  );
  if (uid == null) err = userErr('Unauthorized', 401);
  if (err) return next(err);
  db.query(`
    INSERT INTO   ratings (pid, uid, rating)
    VALUES        ($1, $2, $3)
    ON CONFLICT
    ON CONSTRAINT unique_rating
    DO UPDATE SET rating = $3
    RETURNING     rating;
  `, [id, uid, rating])
    .then(data => res.json(data.rows[0]))
    .catch(err => next({ err }));
});

app.get('/api/product', (req, res, next) => {
  const { uid = null } = req.session;
  let { id = null } = req.query;
  const err = verifyMultiple(
    [id, true, isPosNum],
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
    ),        ratings_cte   AS (
      SELECT    AVG(rating) AS rating,
                COUNT(*) AS rating_count,
                (
                  SELECT  rating
                  FROM    ratings
                  WHERE   uid = $2
                ) AS user_rating,
                pid AS id
      FROM      ratings AS r
      GROUP BY  pid
    )
    SELECT    p.*,
              i.images,
              s.shipping_methods,
              COALESCE(r.rating,        0) AS rating,
              COALESCE(r.user_rating,   0) AS user_rating,
              COALESCE(r.rating_count,  0) AS rating_count
    FROM      products      AS p
    LEFT JOIN images_cte    AS i USING(id)
    LEFT JOIN shipping_cte  AS s USING(id)
    LEFT JOIN ratings_Cte   AS r USING(id)
    WHERE     id = $1;
  `, [id, uid])
    .then(data => {
      const result = data.rows[0];
      result.price /= 100;
      result.discount /= 100;
      result.rating = Math.ceil(parseFloat(result.rating) * 10) / 10;
      res.json(result);
    }).catch(err => next({ err }));
});

app.put('/api/cart/product', (req, res, next) => {
  const { cid } = req.session;
  const { id, qty } = req.body;
  let err = verifyMultiple(
    [id, true, isPosNum],
    [qty, true, isNum],
  );
  if (cid == null) err = userErr('User missing cart', 400);
  if (err) return next(err);
  db.query(`
    WITH products_cte AS (
      SELECT  qty
      FROM    products
      WHERE   id = $2
    )
    INSERT INTO   cart_products AS c (cid, pid, qty)
    SELECT        $1,
                  $2,
                  LEAST(p.qty, GREATEST($3, 0))
    FROM          products_cte AS p
    ON CONFLICT
    ON CONSTRAINT unique_cart_product
    DO UPDATE SET qty = LEAST((
      SELECT  qty
      FROM    products_cte
    ), GREATEST(c.qty + $3, 0))
    RETURNING     qty;
  `, [cid, id, qty])
    .then(data => res.json(data.rows[0]))
    .catch(err => next({ err }));
});

app.get('/api/cart', (req, res, next) => {
  const { cid } = req.session;
  if (cid == null) return next(userErr('User missing cart', 400));
  db.query(`
    SELECT      ${productSelect('p')},
                p.qty
    FROM        cart_products
    LEFT JOIN   products AS p ON(p.id = pid)
    WHERE       cid = $1;
  `, [cid])
    .then(data => res.json(data.rows.map(product => {
      const { price, discount } = product;
      product.price = (price - discount) / 100;
      delete product.discount;
      return product;
    }))).catch(err => next({ err }));
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
