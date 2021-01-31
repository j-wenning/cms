import Home from './Home';
import Search from './Search';
import Product from './Product';
import Cart from './Cart';
import Checkout from './Checkout';
import Receipt from './Receipt';
import _404 from './404';

const routes = [
  {
    path: '/',
    component: Home,
    routes: []
  },
  {
    path: '/search',
    component: Search,
    routes: []
  },
  {
    path: '/product',
    component: Product,
    routes: []
  },
  {
    path: '/cart',
    component: Cart,
    routes: []
  },
  {
    path: '/checkout',
    component: Checkout,
    routes: []
  },
  {
    path: '/receipt',
    component: Receipt,
    routes: []
  },
  {
    path: '*',
    component: _404,
    routes: []
  },
];

Object.freeze(routes);

export default routes;
