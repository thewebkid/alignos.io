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
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue'),
    meta: { title: 'About' }
  },
  {
    path: '/notrack',
    name: 'notrack',
    component: () => import('../views/NoTrack.vue'),
    meta: { title: 'Opt Out of Tracking' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

export default routes
