const PagePending = () => import('../views/PagePending.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: PagePending,
    meta: { title: null }
  },
  {
    path: '/lattice',
    name: 'lattice',
    component: () => import('../views/CodexLattice.vue'),
    meta: { title: 'Codex Lattice' }
  },
  {
    path: '/codex/:id',
    name: 'reader',
    component: () => import('../views/ReaderView.vue'),
    meta: { title: 'Reading' }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: { title: 'Search' }
  },
  {
    path: '/before-you-begin',
    name: 'before-you-begin',
    component: PagePending,
    meta: { title: 'Before You Begin…' }
  },
  {
    path: '/return-room',
    name: 'return-room',
    component: PagePending,
    meta: { title: 'Begin a Return Room' }
  },
  {
    path: '/between-worlds',
    name: 'between-worlds',
    component: PagePending,
    meta: { title: 'Between Worlds' }
  },
  {
    path: '/papers',
    name: 'papers',
    component: PagePending,
    meta: { title: 'Papers' }
  },
  {
    path: '/faq',
    name: 'faq',
    component: PagePending,
    meta: { title: 'FAQ' }
  },
  {
    path: '/arc-of-difference',
    name: 'arc-of-difference',
    component: PagePending,
    meta: { title: 'The Arc of Difference' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

export default routes
