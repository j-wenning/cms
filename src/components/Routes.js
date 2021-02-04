import Home from './Home';
import Search from './Search';
import Product from './Product';
import Cart from './Cart';
import Checkout from './Checkout';
import Order from './Order';
import Orders from './Orders';
import _404 from './404';

const routes = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/search',
    component: Search,
  },
  {
    path: '/product',
    component: Product,
  },
  {
    path: '/cart',
    component: Cart,
  },
  {
    path: '/checkout',
    component: Checkout,
  },
  {
    path: '/orders/:oid',
    component: Order,
  },
  {
    path: '/orders',
    component: Orders,
  },
  {
    path: '*',
    component: _404,
  },
];

Object.freeze(routes);

export default routes;
