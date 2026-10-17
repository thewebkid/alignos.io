import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'lattice-state'
const LEGACY_SCROLL_KEY = 'lattice-position'
const SAVE_DELAY_MS = 150

export const PROGRESS_FILTERS = ['all', 'unread', 'reading', 'complete']
const SCOPE_KINDS = ['series', 'collection']

const DEFAULTS = { scope: null, progress: 'all', scrollTop: 0 }

const isScope = (s) => s === null || (SCOPE_KINDS.includes(s?.kind) && typeof s.id === 'string' && s.id !== '')

export const sameScope = (a, b) => (a?.kind ?? null) === (b?.kind ?? null) && (a?.id ?? null) === (b?.id ?? null)

// `?series=` wins over `?collection=`, as the lattice has always read them
export const scopeFromQuery = (query = {}) => {
  if (typeof query.series === 'string' && query.series) return { kind: 'series', id: query.series }
  if (typeof query.collection === 'string' && query.collection) return { kind: 'collection', id: query.collection }
  return null
}

export const queryFromScope = (scope) => (scope ? { [scope.kind]: scope.id } : {})

// A URL scope that differs from memory replaces it with a fresh view of that scope; no URL scope,
// or the remembered one, keeps memory (which is how back/forward lands where the visitor was)
export const resolveArrival = (urlScope, memory) => {
  if (!urlScope || sameScope(urlScope, memory.scope)) return memory
  return { scope: urlScope, progress: 'all', scrollTop: 0 }
}

// Docked bar: bring the results' start to just under it. Not docked: leave the scroll alone.
export const filterChangeScrollTarget = ({ scrollTop, dockTop }) => (scrollTop >= dockTop - 1 ? dockTop : null)

const scopeFromLocation = (to) => {
  if (typeof to === 'string') {
    const url = new URL(to, 'http://local')
    return url.pathname === '/lattice' ? scopeFromQuery(Object.fromEntries(url.searchParams)) : null
  }
  return to?.name === 'lattice' || to?.path === '/lattice' ? scopeFromQuery(to.query) : null
}

const loadFromStorage = () => {
  if (typeof window === 'undefined') return { ...DEFAULTS }
  try {
    localStorage.removeItem?.(LEGACY_SCROLL_KEY)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
    return {
      scope: isScope(stored.scope ?? null) ? stored.scope ?? null : null,
      progress: PROGRESS_FILTERS.includes(stored.progress) ? stored.progress : DEFAULTS.progress,
      scrollTop: Number.isFinite(stored.scrollTop) && stored.scrollTop > 0 ? stored.scrollTop : 0
    }
  } catch (e) {
    console.warn('Failed to load lattice state:', e)
    return { ...DEFAULTS }
  }
}

export const useLatticeStateStore = defineStore('latticeState', () => {
  const initial = loadFromStorage()
  const scope = ref(initial.scope)
  const progress = ref(initial.progress)
  const scrollTop = ref(initial.scrollTop)

  let saveTimer = null
  const flush = () => {
    clearTimeout(saveTimer)
    saveTimer = null
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        scope: scope.value,
        progress: progress.value,
        scrollTop: scrollTop.value
      }))
    } catch (e) {
      console.warn('Failed to save lattice state:', e)
    }
  }

  watch([scope, progress, scrollTop], () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(flush, SAVE_DELAY_MS)
  })

  const apply = (state) => {
    scope.value = state.scope
    progress.value = state.progress
    scrollTop.value = state.scrollTop
  }

  // A fresh view of a scope: links into the lattice and URLs naming a new scope
  const openScope = (next) => apply({ scope: next, progress: 'all', scrollTop: 0 })

  // The lattice's own scope menu; the progress filter carries over
  const setScope = (next) => {
    scope.value = next
  }

  const setProgress = (next) => {
    if (PROGRESS_FILTERS.includes(next)) progress.value = next
  }

  const reset = () => {
    scope.value = null
    progress.value = 'all'
  }

  const saveScroll = (top) => {
    scrollTop.value = Math.max(0, Math.round(top))
  }

  const arrive = (urlScope) => {
    apply(resolveArrival(urlScope, { scope: scope.value, progress: progress.value, scrollTop: scrollTop.value }))
  }

  // Click handler for links into a scoped lattice: set the state, then let the link navigate.
  // Modified clicks open a new tab, which arrives through the URL instead.
  const primeLink = (to, event) => {
    if (event && (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)) return
    const next = scopeFromLocation(to)
    if (next) openScope(next)
  }

  return {
    scope,
    progress,
    scrollTop,
    openScope,
    setScope,
    setProgress,
    reset,
    saveScroll,
    arrive,
    primeLink,
    flush
  }
})
