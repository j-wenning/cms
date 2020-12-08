import Home from './Home';
import Search from './Search';
import Product from './Product';
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
    path: '*',
    component: _404,
    routes: []
  }
];

Object.freeze(routes);

export default routes;
