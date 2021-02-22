require('dotenv/config');
const https = require('https');
const { commerce } = require('faker');
const { writeFileSync, readFileSync, readdirSync, unlinkSync } = require('fs');
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DB_URL });
let apiData;
let {
  qty,
} = Object.fromEntries(process.argv.filter(arg => /.=./.test(arg)).map(arg => arg.split('=')));
try {
  apiDate = JSON.parse(readFileSync(__dirname + '/api.json', 'utf8'));
} catch (err) { console.error('api json file missing or corrupt, creating new object'); }
apiData = Object.assign({
  pexels: {
    hourlyLimit: 200,
    hourlyReset: null,
    monthlyLimit: 20000,
    monthlyReset: null,
  },
}, apiData);
qty = Number(qty) || parseInt(qty) || 1;
client.connect();
const generateImages = async (searchString = '', imgCount = 1) => {
  const { pexels } = apiData;
  const iniRes = await new Promise((resolve, reject) => {
    https.get({
      host: 'api.pexels.com',
      path: encodeURI(`/v1/search?query=${searchString}&size=small`),
      headers: { Authorization: process.env.PEXELS_API_KEY },
    }, response => {
      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => resolve({
        headers: response.headers,
        body: JSON.parse(data),
      }));
    }).on('error', err => reject(err));
  }).catch(err => { throw new Error(err); });
  const {
    headers:
    {
      'x-ratelimit-remaining': monthlyLimit,
      'x-ratelimit-reset': monthlyReset,
    }
  } = iniRes;
  --pexels.hourlyLimit;
  pexels.monthlyLimit = parseInt(monthlyLimit);
  pexels.monthlyReset = Number(new Date()) + parseInt(monthlyReset);
  const photos = iniRes.body.photos.map(photo => ({
    name: `${Buffer.from(photo.id + photo.photographer + photo.photographer_id).toString('base64')}.jpg`,
    alt: 'randomly generated image',
    url: photo.src.medium,
    order: Math.ceil(Math.random() * 10),
  })).filter((_, i) => i < imgCount);
  return await Promise.all(
    photos.map(photo => {
      const { name, alt, url, order } = photo;
      return new Promise((resolve, reject) => {
        https.get(url, result => {
          let data = '';
          result.setEncoding('binary');
          result.on('data', chunk => data += chunk);
          result.on('end', () => resolve({
            blob: Buffer.from(data, 'binary'),
            name, alt, order,
          }));
        }).on('error', err => reject(err));
      }).catch(err => { throw new Error(err); });
    })
  );
};
const generateProduct = async () => {
  const { rows: users } = await client.query('SELECT id FROM users;');
  const { rows: [{ id: stdShippingId }] } = await client.query('SELECT id FROM shipping_methods WHERE name ~ \'standard|std\';');
  const { rows: shippingMethods } = await client.query('SELECT id FROM shipping_methods;');
  const product = {
    name: commerce.productName(),
    description: commerce.productDescription(),
    information: '',
    price: parseInt(commerce.price(0, 10000, 0)),
    tags: [...new Array(Math.ceil(Math.random() * 10))].map(() => commerce.productAdjective()),
    qty: Math.ceil(Math.random() * 100),
    ratings: users.map(u => Math.random() > 0.5 ? { uid: u.id, rating: Math.ceil(Math.random() * 10) } : null).filter(r => r !== null),
    images: [],
    discount: 0,
    shipping: [...new Set([stdShippingId, ...shippingMethods.map(m => m.id).filter(() => Math.random() > 0.45)])],
  };
  try {
    const discountVal = Math.random();
    Object.assign(product, {
      images: await generateImages(product.name, Math.ceil(Math.random() * 3)),
      information: await new Promise((resolve, reject) => {
        const url = 'https://jaspervdj.be/lorem-markdownum/markdown.txt?no-code=on&no-external-links=on';
        https.get(url, result => {
          let data = '';
          result.on('data', chunk => data += chunk);
          result.on('end', () => resolve(
            data.substr(0, 500).match(/(.|\n)+(((?<!\d)\.)|\?|!|\n(?:(?=-|\d|\n|\s)))/g).join('')
          ));
        }).on('error', err => reject(err));
      }).catch(err => { throw new Error(err); }),
      discount: discountVal > 0.4 ? 0 : parseInt(commerce.price(0, 0.75 * product.price, 0)),
    });
  } catch (err) { console.error(err); }
  return product;
};
const generateProducts = async (qty = 1) => {
  const { pexels } = apiData;
  const curTime = Number(new Date());
  if (curTime > pexels.monthlyReset) {
    pexels.monthlyReset = curTime + 2678400000;
    pexels.monthlyLimit = 20000;
  }
  if (curTime > pexels.hourlyReset) {
    pexels.hourlyReset = curTime + 3600000;
    pexels.hourlyLimit = Math.min(200, pexels.monthlyLimit)
  }
  if (pexels.hourlyLimit < qty) throw new Error('Quantity will exceed hourly limit of 200 requests, requests remaining:' + pexels.hourlyLimit);
  if (pexels.monthlyLimit < qty) throw new Error('Quantity will exceed monthly limit of 20,000 requests, requests remaining:' + pexels.monthlyLimit);
  const products = await Promise.all([...new Array(qty)].map(() => generateProduct())).catch(err => { throw new Error(err); });
  writeFileSync(__dirname + '/api.json', JSON.stringify(apiData));
  return products;
};
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
  const chunkSize = 50;
  const chunkedProducts = [...new Array(Math.ceil(products.length / chunkSize))]
    .map((_, i) => products.slice(i * chunkSize, i * chunkSize + chunkSize));
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
    for(let i = 0; i < chunkedProducts.length; ++i) {
      const chunk = chunkedProducts[i];
      await client.query(`
        WITH  input_cte           AS (
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
        ),    products_cte        AS (
          INSERT INTO products(name, description, information, price, discount, qty)
          SELECT      name, description, information, price, discount, qty
          FROM        input_cte
          ON CONFLICT DO NOTHING
          RETURNING   *
        ),    input_products_cte  AS (
          SELECT  *
          FROM    input_cte AS i
          JOIN    products_cte AS p ON(
            i.name        = p.name        AND
            i.description = p.description
          )
        ),    tags_cte            AS (
          INSERT INTO tags(pid, name)
          SELECT      id AS pid, UNNEST(tags) AS name
          FROM        input_products_cte
          ON CONFLICT DO NOTHING
          RETURNING   1
        ),    ratings_cte         AS (
          INSERT INTO ratings(pid, uid, rating)
          SELECT      i.id, r.*
          FROM        input_products_cte  AS i,
                      JSONB_TO_RECORDSET(
                        COALESCE((
                          SELECT  TO_JSONB(ARRAY_AGG(r))
                          FROM    UNNEST(ratings) AS r
                          WHERE   r IS NOT NULL
                        ), '[]'::JSONB)
                      )                   AS r  (uid INTEGER, rating SMALLINT)
          INNER JOIN  users AS u ON(r.uid = u.id)
          ON CONFLICT DO NOTHING
          RETURNING   1
        ),    shipping_cte        AS (
          INSERT INTO shipping(pid, shipping_method)
          SELECT      id  AS pid,
                      UNNEST(
                        shipping & (SELECT ARRAY_AGG(id) FROM shipping_methods)
                      )   AS shipping_method
          FROM        input_products_cte
          ON CONFLICT DO NOTHING
          RETURNING   1
        ),    images_cte          AS (
          INSERT INTO images(pid, url, alt, img_order)
          SELECT      ip.id AS pid, i.name AS url, i.alt, i.order AS img_order
          FROM        input_products_cte                    AS ip,
                      JSONB_TO_RECORDSET(TO_JSONB(images))  AS i    (name TEXT, alt TEXT, "order" SMALLINT)
          ON CONFLICT DO NOTHING
          RETURNING   1
        )
        SELECT  1;
      `, [chunk]);
    }
  } catch (err) { console.error(err); }
  client.end();
})().catch(err => { throw new Error(err); });
