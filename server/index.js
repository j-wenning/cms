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
const prodImgSelect = (alias = '') => {
  if (alias) alias += '.';
  return `
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
const verify = (val, required = true, expected = null, ...args) => {
  if (!required && val == null) return null;
  if (required && val == null) return userErr('Missing required value');
  if (expected) {
    const err = expected(val, ...args);
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
const isNum = val => /[^0-9]/g.test(val.toString()) ? 'number' : null;
const isPosNum = val => isNum(val) || (val < 0) ? 'positive number' : null;
const isPosNumOfMinLength = (val, min = 1) => isPosNum(val) || (val.toString().length < min) ? 'positive number of min length ' + min : null;
const isPosNumOfMaxLength = (val, max = 1) => isPosNum(val) || (val.toString().length > max) ? 'positive number of max length ' + max : null;
const isPosNumOfLength = (val, length = 1) => isPosNum(val) || (val.toString().length !== length) ? 'positive number of length ' + length : null;
const isValidRating = val => val < 1 || val > 10 ? 'valid rating' : null;
const isStr = val => typeof val === typeof String() ? null : 'string';
const isStrOfMinLength = (val, min = 1) => isStr(val) || (val.length < min) ? 'string of min length ' + min : null;
const isStrOfMaxLength = (val, max = 1) => isStr(val) || (val.length > max) ? 'string of max length ' + max : null;
const isStrOfLength = (val, length = 1) => isStr(val) || (val.length !== length) ? 'string of length ' + lengths : null;
const isStrOfLengths = (val, lengths = [1]) => isStr(val) || !lengths.includes(val.length) ? 'string of lengths ' + lengths : null;
const isDate = val => isNaN(Date.parse(val)) ? 'date' : null;
const formatKeys = obj => {
  const result = Array.isArray(obj) ? [] : {};
  if (obj == null || typeof obj !== typeof Object()) return obj;
  for (const key in obj) {
    const newKey = key.replace(/(-|_)\w/g, val => val[1].toLocaleUpperCase()).replace(/_/g, '')
    result[newKey] = formatKeys(obj[key]);
  }
  return result;
};

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

app.use((req, res, next) => {
  if (req.session.uid == null) req.session.uid = 1;
  next();
});

app.use('/bootstrap', express.static(path.resolve(__dirname, '..', 'node_modules', 'bootstrap-icons', 'icons/')));

app.use(express.static(path.resolve(__dirname, '..', 'public/')));

app.use(async (req, res, next) => {
  const { uid } = req.session;
  if (uid == null) return next();
  try {
    await db.query('BEGIN;');
    const { rows: [{ cid } = {}] = [] } = await db.query(`
      WITH  carts_cte_sel AS (
        SELECT  id
        FROM    carts AS c
        WHERE   uid = $1 AND NOT EXISTS(
          SELECT  1
          FROM    orders AS o
          WHERE   o.cid = c.id
        )
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
    `, [uid]);
    await db.query('COMMIT;');
    req.session.cid = cid;
    next();
  } catch (err) { next({ err }); }
});

app.post('/api/user', (req, res, next) => {
  let { uid } = req.body;
  const err = verifyMultiple(
    [uid, true, isPosNumOfMinLength],
  );
  if (err) return next(err);
  db.query(`
    SELECT  id AS uid
    FROM    users
    WHERE   id = $1;
  `, [uid])
    .then(data => {
      if (data.rows.length === 0) return userErr('Not found', 401);
      req.session.uid = data.rows[0].uid;
      res.sendStatus(200);
    }).catch(err => next({ err }));
});

app.get('/api/user', (req, res) => res.json({ uid: req.session.uid }));

app.get('/api/users', (req, res, next) => {
  db.query(`
    SELECT  id AS uid
    FROM    users;
  `).then(data => res.json(data.rows))
    .catch(err => next({ err }));
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
      SELECT    p.id,
                p.name,
                p.price,
                p.discount,
                ${prodImgSelect('p')},
                ARRAY_AGG(t.name) AS tags
      FROM      products  AS p
      LEFT JOIN tags      AS t ON (t.pid = p.id)
      GROUP BY  p.id
    )
    SELECT  id,
            name,
            price,
            discount,
            ${prodImgSelect()}
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
    SELECT    p.id,
              p.name,
              p.price,
              p.discount,
              ${prodImgSelect('p')},
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
          totalResults: data.rows[0]?.total_results
        },
        products: data.rows.map(row => {
          delete row.total_results;
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
                  JSON_BUILD_OBJECT(
                    'id', sm.id,
                    'name', sm.name
                  )
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

app.get('/api/cart/shippingmethods', (req, res, next) => {
  const { cid } = req.session;
  if (cid == null) return next(userErr('User missing cart', 400));
  db.query(`
    SELECT  (
        SELECT  JSON_AGG(s)
        FROM    shipping_methods AS s
      ) AS shipping_methods,
      COALESCE(
        (
          SELECT    ARRAY_AGG((
                      SELECT    JSON_AGG(sm)
                      FROM      shipping          AS s
                      LEFT JOIN shipping_methods  AS sm ON(sm.id = s.shipping_method)
                      WHERE     s.pid = c.pid
                      GROUP BY  s.pid
                    ))
          FROM      cart_products     AS c
          WHERE     c.cid = $1
        ), ARRAY[NULL]::JSON[]
      ) AS user_shipping;
  `, [cid])
    .then(data => {
      let [{ shippingMethods, userShipping }] = formatKeys(data.rows);
      userShipping = userShipping.reduce((agg, methods) =>
        agg.filter(aggMethod => methods?.find(method => method.id === aggMethod.id) != null),
        shippingMethods
      );
      res.json({ shippingMethods: userShipping });
    }).catch(err => next({ err }));
});

app.put('/api/cart/product', (req, res, next) => {
  const { cid } = req.session;
  const { id, qty } = req.body;
  let err = verifyMultiple(
    [id, true, isPosNum],
    [qty, true, isPosNum],
  );
  if (cid == null) err = userErr('User missing cart', 400);
  if (err) return next(err);
  db.query(`
    INSERT INTO   cart_products (cid, pid, qty)
    VALUES        ($1, $2, $3)
    ON CONFLICT
    ON CONSTRAINT unique_cart_product
    DO UPDATE SET qty = $3
    RETURNING     qty;
  `, [cid, id, qty])
    .then(data => res.json(data.rows[0]))
    .catch(err => next({ err }));
});

app.put('/api/cart/checkout', async (req, res, next) => {
  let { uid, cid } = req.session;
  const { single } = req.query;
  const {
    address,
    paymentMethod,
    shippingMethod,
    pid,
    qty
  } = req.body;
  let err = verifyMultiple(
    [address, true, isPosNum],
    [paymentMethod, true, isPosNum],
    [shippingMethod, true, isPosNum],
    [pid, single != null, isPosNum],
    [qty, single != null, isPosNumOfMinLength],
  );
  if (cid == null) err = userErr('User missing cart', 400);
  if (uid == null) err = userErr('Unauthorized', 401)
  if (err) return next(err);
  try {
    await db.query('BEGIN;')
    if (single != null) {
      const { rows: [{ id }] } = await db.query(`
        INSERT INTO carts(uid)
        VALUES      ($1)
        RETURNING   id;
      `, [uid]);
      cid = id;
      await db.query(`
        INSERT INTO cart_products(cid, pid, qty)
        VALUES      ($1, $2, $3);
      `, [cid, pid, qty]);
    }
    await db.query(`
      DELETE FROM cart_products
      WHERE       cid = $1 AND qty = 0;
    `, [cid]);
    await db.query(`
      DELETE FROM carts
      WHERE       id = $1 AND NOT EXISTS (
        SELECT  1
        FROM    cart_products
        WHERE   cid = $1
      );
    `, [cid]);
    const data = await db.query(`
      INSERT INTO orders(cid, address, payment_method, shipping_method)
      VALUES  (
        $2,
        (
          SELECT  id
          FROM    addresses
          WHERE   uid = $1 AND id = $3
        ),
        (
          SELECT  id
          FROM    payment_methods
          WHERE   uid = $1 AND id = $4
        ),
        (
          SELECT  id
          FROM    shipping_methods
          WHERE   id = $5 AND EXISTS(
            SELECT  1
            FROM    cart_products
            WHERE   cid = $2
            LIMIT   1
          ) AND NOT EXISTS(
            SELECT  1
            FROM    (
              SELECT    ARRAY_AGG(s.shipping_method) AS shipping_methods
              FROM      cart_products AS c
              JOIN      shipping      AS s USING(pid)
              WHERE     c.cid = $2
              GROUP BY  c.pid
            ) AS c
            WHERE   NOT ARRAY[$5] <@ c.shipping_methods
          )
        )
      )
      RETURNING   id AS oid;
    `, [uid, cid, address, paymentMethod, shippingMethod]);
    await db.query(`
      UPDATE    products      AS p
      SET       qty = p.qty - c.qty
      FROM      cart_products AS c
      WHERE     c.cid = $1 AND p.id = c.pid;
    `, [cid]);
    await db.query('COMMIT;');
    res.json(data.rows[0]);
  } catch (err) {
    next(
      (() => {
        switch(parseInt(err.code)) {
          case 23502: return userErr();
          case 42830: return userErr(undefined, 404);
          default: return { err };
        }
      })()
    );
  }
});

app.delete('/api/cart/product', (req, res, next) => {
  const { cid } = req.session;
  const { id } = req.body;
  let err = verifyMultiple(
    [id, true, isPosNum],
  );
  if (cid == null) err = userErr('User missing cart', 400);
  if (err) return next(err);
  db.query(`
    DELETE FROM cart_products
    WHERE       cid = $1 AND pid = $2
    RETURNING   pid;
  `, [cid, id])
    .then(data => {
      const { pid: id } = data.rows[0];
      res.json({ id });
    }).catch(err => next({ err }));
});

app.get('/api/cart/qty', (req, res, next) => {
  const { cid } = req.session;
  if (cid == null) return next(userErr('User missing cart', 400));
  db.query(`
    SELECT      SUM(cp.qty) AS qty
    FROM        cart_products AS cp
    LEFT JOIN   products      AS p  ON(p.id = pid)
    WHERE       cid = $1;
  `, [cid])
    .then(data => res.json(data.rows[0]))
    .catch(err => next({ err }));
});

app.get('/api/cart', (req, res, next) => {
  const { cid } = req.session;
  if (cid == null) return next(userErr('User missing cart', 400));
  db.query(`
    SELECT      cp.qty,
                p.id,
                p.name,
                p.price,
                p.discount,
                ${prodImgSelect('p')}
    FROM        cart_products AS cp
    LEFT JOIN   products      AS p  ON(p.id = pid)
    WHERE       cid = $1;
  `, [cid])
    .then(data => res.json(data.rows.map(product => {
      const { price, discount } = product;
      product.price = (price - discount) / 100;
      delete product.discount;
      return product;
    }))).catch(err => next({ err }));
});

app.get('/api/user/checkout', (req, res, next) => {
  const { uid } = req.session;
  if (uid == null) return next(userErr('Unauthorized', 401));
  db.query(`
    SELECT  (
        SELECT  ARRAY_AGG(
                  JSON_BUILD_OBJECT(
                    'id',           id,
                    'region',       region,
                    'city',         city,
                    'address_1',    address_1,
                    'postal_code',  postal_code
                  )
                )
        FROM    addresses
        WHERE   uid = $1
      ) AS addresses,
      (
        SELECT  ARRAY_AGG(
                  JSON_BUILD_OBJECT(
                    'id',           id,
                    'card_number',  card_number
                  )
                )
        FROM    payment_methods_view
        WHERE   uid = $1
      ) AS payment_methods;
  `, [uid])
    .then(data => res.json({ ...formatKeys(data.rows[0]) }))
    .catch(err => next({ err }));
});

app.post('/api/user/address', (req, res, next) => {
  const { uid } = req.session;
  const {
    address1,
    address2 = '',
    city,
    region,
    country,
    postalCode
  } = req.body;
  let err = verifyMultiple(
    [address1, true, isStrOfMinLength],
    [address2, false, isStr],
    [city, true, isStrOfMinLength],
    [region, true, isStrOfMinLength],
    [country, true, isStrOfMinLength],
    [postalCode, true, isStrOfLengths, [5, 10]],
  );
  if (uid == null) err = userErr('Unauthorized', 401);
  if (err) return next(err);
  db.query(`
    INSERT INTO addresses(uid, address_1, address_2, country, region, city, postal_code)
    VALUES      ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT DO NOTHING
    RETURNING   id;
  `, [uid, address1, address2, country, region, city, postalCode])
    .then(data => {
      const [obj] = data.rows;
      if (!obj) return next(userErr('Duplicate entry'));
      res.json(obj);
    }).catch(err => next({ err }));
});

app.post('/api/user/paymentmethod', (req, res, next) => {
  const { uid } = req.session;
  const {
    cardNumber,
    securityCode,
    cardName,
    expiry,
  } = req.body;
  let err = verifyMultiple(
    [cardNumber, true, isPosNumOfLength, 16],
    [securityCode, true, isPosNumOfMinLength],
    [cardName, true, isStrOfMinLength],
    [expiry, true, isDate],
  );
  if (uid == null) err = userErr('Unauthorized', 401);
  if (err) return next(err);
  db.query(`
    INSERT INTO payment_methods(uid, card_number, security_code, name, expiry)
    VALUES      ($1, $2, $3, $4, $5)
    ON CONFLICT DO NOTHING
    RETURNING   id;
  `, [uid, cardNumber, securityCode, cardName, expiry])
    .then(data => {
      const [obj] = data.rows;
      if (!obj) return next(userErr('Duplicate entry'));
      res.json(obj);
    }).catch(err => next({ err }));
});

app.delete('/api/user/address', (req, res, next) => {
  const { uid } = req.session;
  const { id } = req.body;
  let err = verifyMultiple(
    [id, true, isPosNum]
  );
  if (uid == null) err = userErr('Unauthorized', 401);
  if (err) return next(err);
  db.query(`
    DELETE FROM addresses
    WHERE       uid = $1 AND id = $2;
  `, [uid, id])
    .then(() => res.sendStatus(204))
    .catch(err => next({ err }));
});

app.delete('/api/user/paymentmethod', (req, res, next) => {
  const { uid } = req.session;
  const { id } = req.body;
  let err = verifyMultiple(
    [id, true, isPosNum]
  );
  if (uid == null) err = userErr('Unauthorized', 401);
  if (err) return next(err);
  db.query(`
    DELETE FROM payment_methods
    WHERE       uid = $1 AND id = $2;
  `, [uid, id])
    .then(() => res.sendStatus(204))
    .catch(err => next({ err }));
});

app.get('/api/orders', (req, res, next) => {
  const { uid } = req.session;
  if (uid == null) next(userErr('Unauthorized', 401));
  db.query(`
    SELECT    o.id,
              o.submitted,
              SUM(((p.price - p.discount) * cp.qty)::FLOAT / 100) AS total
    FROM      orders        AS o
    JOIN      carts         AS c  ON(c.id = o.cid)
    JOIN      cart_products AS cp ON(cp.cid = c.id)
    JOIN      products      AS p  ON(p.id = cp.pid)
    WHERE     c.uid = $1
    GROUP BY  o.id
    ORDER BY  o.submitted;
  `, [uid])
    .then(data => res.json(data.rows))
    .catch(err => next({ err }));
});

app.get('/api/order', (req, res, next) => {
  const { uid } = req.session;
  const { oid } = req.query;
  let err = verifyMultiple(
    [oid, true, isPosNumOfMinLength]
  );
  if (uid == null) err = userErr('Unauthorized', 401);
  if (err) return next(err);
  db.query(`
    SELECT  JSON_BUILD_OBJECT(
        'products', (
          SELECT    ARRAY_AGG(
                      JSON_BUILD_OBJECT(
                        'id',     p.id,
                        'name',   p.name,
                        'price',  ((p.price - p.discount) * c.qty)::FLOAT / 100,
                        'qty',     c.qty
                      )
                    )
          FROM      cart_products AS c
          LEFT JOIN products      AS p  ON(p.id = c.pid)
          WHERE     c.cid = o.cid
        ),
        'address', (
          SELECT    JSON_BUILD_OBJECT(
                      'region',       region,
                      'city',         city,
                      'address_1',    address_1,
                      'address_2',    address_2,
                      'postal_code',  postal_code
                    )
          FROM      addresses
          WHERE     id = o.address
          LIMIT     1
        ),
        'shipping_method', (
          SELECT  name
          FROM    shipping_methods
          WHERE   id = o.shipping_method
          LIMIT   1
        )
      ) AS obj
    FROM    orders AS o
    JOIN    carts  AS c ON(o.cid = c.id)
    WHERE   c.uid = $1 AND o.id = $2;
  `, [uid, oid])
    .then(data => {
      const { rows: [{ obj: { ...objData } = {} } = {}] } = data;
      if (Object.keys(objData).length === 0) return next(userErr('Not found', 404));
      res.json(formatKeys(objData));
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
