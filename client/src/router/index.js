const PageView = () => import('../views/PageView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
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
    component: PageView,
    meta: {
      title: 'Before You Begin…',
      page: 'before-you-begin',
      layout: 'threshold',
      next: { label: 'Begin a Return Room', to: '/return-room' }
    }
  },
  {
    path: '/return-room',
    name: 'return-room',
    component: PageView,
    meta: { title: 'Begin a Return Room', page: 'return-room', layout: 'standard' }
  },
  {
    path: '/between-worlds',
    name: 'between-worlds',
    component: PageView,
    meta: {
      title: 'Between Worlds',
      page: 'between-worlds',
      layout: 'threshold',
      next: {
        label: 'Between Worlds: The Architecture of the Third Structure',
        to: '/codex/between-worlds-the-architecture-of-the-third-structure'
      }
    }
  },
  {
    path: '/papers',
    name: 'papers',
    component: PageView,
    meta: { title: 'Papers', page: 'papers', layout: 'standard' }
  },
  {
    path: '/faq',
    name: 'faq',
    component: PageView,
    meta: { title: 'FAQ', page: 'faq', layout: 'standard' }
  },
  {
    path: '/arc-of-difference',
    name: 'arc-of-difference',
    component: PageView,
    meta: {
      title: 'The Arc of Difference',
      page: 'arc-of-difference',
      layout: 'threshold',
      next: {
        label: 'Begin a Return Room',
        to: '/return-room',
        secondary: [{ label: 'Codex Lattice', to: '/lattice' }]
      }
    }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

export default routes
