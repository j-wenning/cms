const faker = require('faker');
const https = require('https');
const {writeFileSync} = require('fs');
const generateProduct = async () => {
  const offset = 2000;
  const product = {
    name: faker.commerce.productName(),
    desc: faker.commerce.productDescription(),
    price: faker.commerce.price(0, 100, 2, '$'),
    tags: [...new Array(Math.ceil(Math.random() * 10))].map(() => faker.commerce.productAdjective()),
    qty: Math.ceil(Math.random() * 100),
    ratings: [...new Array(4)].map(() => Math.ceil(Math.random() * 10)),
  };
  try {
    Object.assign(product, {
      images: await Promise.all([...new Array(Math.ceil(Math.random() * 3))].map((a, i) => {
        const url = faker.image.unsplash.objects(undefined, undefined, product.name);
        return new Promise(resolve => {
          setTimeout(() => {
            https.get(url, res => {
              res.on('data', () => {});
              res.on('end', () => {
                const url = res.headers.location;
                https.get(url, res => {
                  let data = [];
                  res.setEncoding('binary');
                  res.on('data', chunk => data.push(Buffer.from(chunk, 'binary')));
                  res.on('end', () => {
                    const name = res.headers['x-imgix-id'];
                    const blob = Buffer.concat(data);
                    const originalUrl = url;
                    writeFileSync(`${__dirname}/../public/images/${name}.jpg`, blob);
                    resolve({ name, blob, originalUrl });
                  });
                }).on('error', err => { throw new Error(err) });
              });
            }).on('error', err => { throw new Error(err) });
          }, i * offset);
        });
      })),
      discount: faker.commerce.price(0, parseFloat(product.price.substr(1)) * 0.75, 2, '$'),
    });
  } catch (err) { console.error(err); }
  return product;
};

generateProduct().then(data => console.log(data));


// https.get('https://images.unsplash.com/photo-1612518150594-7149908defd9?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=480&ixlib=rb-1.2.1&q=80&w=640', res => {
//   let data = [];
//   res.setEncoding('binary')
//   res.on('data', chunk => data.push(Buffer.from(chunk, 'binary')));
//   res.on('end', () => {
//     const buffer = Buffer.concat(data);
//     console.log(res.headers)
//     // fs.writeFileSync(__dirname + '/../public/images/img.jpg', buffer);
//   });
// }).on('error', err => { throw new Error(err) });
