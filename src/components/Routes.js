import Home from './Home'

const routes = [
  {
    path: '/',
    component: Home,
    routes: []
  },
  {
    path: '/cart'
  }
]

Object.freeze(routes)

export default routes
