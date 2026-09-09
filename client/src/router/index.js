const routes = [
  {
    path: '/',
    name: 'browse',
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
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

export default routes
