const { commerce, image } = require('faker');
const https = require('https');
const generateProduct = async () => {
  const offset = 2000;
  const product = {
    name: commerce.productName(),
    desc: commerce.productDescription(),
    price: commerce.price(0, 100, 2, '$'),
    tags: [...new Array(Math.ceil(Math.random() * 10))].map(() => commerce.productAdjective()),
    qty: Math.ceil(Math.random() * 100),
    ratings: [...new Array(4)].map(() => Math.ceil(Math.random() * 10)),
    images: [...new Array(Math.ceil(Math.random() * 3))],
  };
  try {
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
      discount: commerce.price(0, parseFloat(product.price.substr(1)) * 0.75, 2, '$'),
    });
  } catch (err) { console.error(err); }
  return product;
};
