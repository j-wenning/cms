require('dotenv/config');
const https = require('https');
const { commerce, image } = require('faker');
const { writeFileSync, readdirSync, unlinkSync } = require('fs');
const { Client } = require('pg');
let {
  qty,
} = Object.fromEntries(process.argv.filter(arg => /.=./.test(arg)).map(arg => arg.split('=')));
qty = Number(qty) || parseInt(qty) || 1;
const generateProduct = async () => {
  const offset = 2000;
  const product = {
    name: commerce.productName(),
    description: commerce.productDescription(),
    price: commerce.price(0, 10000, 0),
    tags: [...new Array(Math.ceil(Math.random() * 10))].map(() => commerce.productAdjective()),
    qty: Math.ceil(Math.random() * 100),
    ratings: [...new Array(4)].map((a, i) => Math.random() > 0.5 ? { rating: Math.ceil(Math.random() * 10), uid: i + 1 } : null).filter(r => r !== null),
    images: [...new Array(Math.ceil(Math.random() * 3))],
    discount: 0,
    shipping: [3, ...[...new Array(2)].map((a, i) => Math.random() > 0.45 ? i + 1 : null).filter(m => m !== null)],
  };
  try {
    const discountVal = Math.random();
    Object.assign(product, {
      images: await Promise.all(product.images.map(async (v, i) => {
        const iniUrl = image.unsplash.objects(undefined, undefined, product.name);
        const srcUrl = await new Promise(resolve => {
          setTimeout(() => {
            https.get(iniUrl, result => {
              result.on('data', () => {});
              result.on('end', () => resolve(result.headers.location));
            }).on('error', err => { throw new Error(err) });
          }, i * offset);
        });
        return new Promise(resolve => {
          https.get(srcUrl, result => {
            let data = '';
            result.setEncoding('binary');
            result.on('data', chunk => data += chunk);
            result.on('end', () => {
              resolve({
                name: result.headers['x-imgix-id'] + '.jpg',
                alt: 'randomly generated image',
                blob: Buffer.from(data, 'binary'),
                order: Math.ceil(Math.random() * 10),
              });
            }).on('error', err => { throw new Error(err) });
          })
        });
      })),
      discount: commerce.price(0, (discountVal > 0.5 ? 0 : 0.75) * product.price, 0),
    });
  } catch (err) { console.error(err); }
  return product;
};
const generateProducts = async (qty = 1) => await Promise.all([...new Array(qty)].map(() => generateProduct()));
(async () => {
  const products = await generateProducts(qty);
  const files = readdirSync(__dirname + '/../public/images');
  files.forEach(file => {
    if (!/default\.svg/i.test(file)) unlinkSync(__dirname + '/../public/images/' + file);
  });
  products.forEach(product => {
    product.images.forEach(image => {
      const { name, blob } = image;
      writeFileSync(`${__dirname}/../public/images/${name}`, blob);
    });
  });
  const client = new Client({ connectionString: process.env.DB_URL });
  client.connect();
  try {
    await client.query('DELETE FROM carts;');
    await client.query('DELETE FROM products;');
    await client.query('ALTER SEQUENCE products_id_seq RESTART;');
    await client.query('ALTER SEQUENCE cart_products_id_seq RESTART;');
    await client.query('ALTER SEQUENCE tags_id_seq RESTART;');
    await client.query('ALTER SEQUENCE images_id_seq RESTART;');
    await client.query('ALTER SEQUENCE ratings_id_seq RESTART;');
    await client.query('ALTER SEQUENCE shipping_id_seq RESTART;');
    await client.query('ALTER SEQUENCE orders_id_seq RESTART;');
    await client.query('ALTER SEQUENCE carts_id_seq RESTART;');
    const a = await client.query(`
      WITH input_cte AS (
        SELECT      *
        FROM        JSONB_TO_RECORDSET(TO_JSONB($1::JSON[]))
        AS          r (
                      name            TEXT,
                      description     TEXT,
                      information     TEXT,
                      price           INTEGER,
                      discount        INTEGER,
                      qty             INTEGER,
                      tags            TEXT[],
                      shipping        INTEGER[],
                      ratings         JSONB[],
                      images          JSONB[]
                    )
      ), products_cte AS (
        INSERT INTO products(name, description, information, price, discount, qty)
        SELECT      name, description, information, price, discount, qty
        FROM        input_cte
        ON CONFLICT DO NOTHING
        RETURNING   *
      ), input_products_cte AS (
        SELECT  *
        FROM    input_cte AS i
        JOIN    products_cte AS p ON(
          i.name        = p.name        AND
          i.description = p.description
        )
      ), tags_cte AS (
        INSERT INTO tags(pid, name)
        SELECT      id AS pid, UNNEST(tags) AS name
        FROM        input_products_cte
        ON CONFLICT DO NOTHING
        RETURNING   1
      ), ratings_cte AS (
        INSERT INTO ratings(pid, uid, rating)
        SELECT      i.id, r.*
        FROM        input_products_cte                    AS i,
                    JSONB_TO_RECORDSET(
                      COALESCE((
                        SELECT  TO_JSONB(ARRAY_AGG(r))
                        FROM    UNNEST(ratings) AS r
                        WHERE   r IS NOT NULL
                      ), '[]'::JSONB)
                    ) AS r  (uid INTEGER, rating SMALLINT)
        INNER JOIN  users AS u ON(r.uid = u.id)
        ON CONFLICT DO NOTHING
        RETURNING   1
      ), shipping_cte AS (
        INSERT INTO shipping(pid, shipping_method)
        SELECT      id  AS pid,
                    UNNEST(
                      shipping & (SELECT ARRAY_AGG(id) FROM shipping_methods)
                    )   AS shipping_method
        FROM        input_products_cte
        ON CONFLICT DO NOTHING
        RETURNING   1
      ), images_cte AS (
        INSERT INTO images(pid, url, alt, img_order)
        SELECT      ip.id AS pid, i.name AS url, i.alt, i.order AS img_order
        FROM        input_products_cte                    AS ip,
                    JSONB_TO_RECORDSET(TO_JSONB(images))  AS i    (name TEXT, alt TEXT, "order" SMALLINT)
        ON CONFLICT DO NOTHING
        RETURNING   1
      )
      SELECT  1;
    `, [products]);
  } catch (err) { console.error(err); }
  client.end();
})();
