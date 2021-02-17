require('dotenv/config');
const https = require('https');
const { commerce, image } = require('faker');
const { writeFileSync, readdirSync, unlinkSync } = require('fs');
let {
  qty,
} = Object.fromEntries(process.argv.filter(arg => /.=./.test(arg)).map(arg => arg.split('=')));
qty = Number(qty) || parseInt(qty) || 1;
const generateProduct = async () => {
  const offset = 2000;
  const product = {
    name: commerce.productName(),
    desc: commerce.productDescription(),
    price: commerce.price(0, 100, 2),
    tags: [...new Array(Math.ceil(Math.random() * 10))].map(() => commerce.productAdjective()),
    qty: Math.ceil(Math.random() * 100),
    ratings: [...new Array(4)].map(() => Math.ceil(Math.random() * 10)),
    images: [...new Array(Math.ceil(Math.random() * 3))],
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
                name: result.headers['x-imgix-id'],
                blob: Buffer.from(data, 'binary'),
              });
            }).on('error', err => { throw new Error(err) });
          })
        });
      })),
      discount: commerce.price(0, (discountVal > 0.5 ? 0 : 0.75) * product.price, 2),
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
      writeFileSync(`${__dirname}/../public/images/${name}.jpg`, blob);
    });
  });
})();
