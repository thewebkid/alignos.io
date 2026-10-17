import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import {
  useLatticeStateStore,
  resolveArrival,
  scopeFromQuery,
  queryFromScope,
  sameScope,
  filterChangeScrollTarget
} from '../../src/stores/latticeState.js'

const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v),
    removeItem: (k) => data.delete(k)
  }
}

const series = (id) => ({ kind: 'series', id })
const collection = (id) => ({ kind: 'collection', id })

describe('lattice state store', () => {
  let storage

  beforeEach(() => {
    vi.useFakeTimers()
    storage = fakeStorage()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', storage)
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('starts at Everything, Any progress, top', () => {
    const store = useLatticeStateStore()
    expect([store.scope, store.progress, store.scrollTop]).toEqual([null, 'all', 0])
  })

  it('persists and reloads scope, progress, and scroll', async () => {
    const store = useLatticeStateStore()
    store.setScope(series('realized-flame'))
    store.setProgress('reading')
    store.saveScroll(812.6)
    await vi.runAllTimersAsync()

    setActivePinia(createPinia())
    const reloaded = useLatticeStateStore()
    expect([reloaded.scope, reloaded.progress, reloaded.scrollTop]).toEqual([series('realized-flame'), 'reading', 813])
  })

  it('flush writes immediately', () => {
    const store = useLatticeStateStore()
    store.saveScroll(400)
    store.flush()
    expect(JSON.parse(storage.getItem('lattice-state')).scrollTop).toBe(400)
  })

  it('ignores invalid saved values', () => {
    storage.setItem('lattice-state', JSON.stringify({ scope: { kind: 'shelf', id: 'x' }, progress: 'skimmed', scrollTop: -5 }))
    const store = useLatticeStateStore()
    expect([store.scope, store.progress, store.scrollTop]).toEqual([null, 'all', 0])
  })

  it('removes the legacy single-position key', () => {
    storage.setItem('lattice-position', '2400')
    useLatticeStateStore()
    expect(storage.getItem('lattice-position')).toBeNull()
  })

  it('openScope starts a fresh view; setScope keeps the progress filter', () => {
    const store = useLatticeStateStore()
    store.setProgress('unread')
    store.saveScroll(900)

    store.setScope(series('realized-flame'))
    expect([store.progress, store.scrollTop]).toEqual(['unread', 900])

    store.openScope(collection('papers'))
    expect([store.scope, store.progress, store.scrollTop]).toEqual([collection('papers'), 'all', 0])
  })

  it('reset clears both filters', () => {
    const store = useLatticeStateStore()
    store.setScope(series('realized-flame'))
    store.setProgress('complete')
    store.reset()
    expect([store.scope, store.progress]).toEqual([null, 'all'])
  })

  it('arrive keeps memory for no URL scope or the remembered one, and replaces it otherwise', () => {
    const store = useLatticeStateStore()
    store.setScope(series('realized-flame'))
    store.setProgress('reading')
    store.saveScroll(700)

    store.arrive(null)
    store.arrive(series('realized-flame'))
    expect([store.scope, store.progress, store.scrollTop]).toEqual([series('realized-flame'), 'reading', 700])

    store.arrive(collection('papers'))
    expect([store.scope, store.progress, store.scrollTop]).toEqual([collection('papers'), 'all', 0])
  })

  it('primeLink opens the linked scope on a plain click only', () => {
    const store = useLatticeStateStore()
    store.setProgress('complete')
    store.saveScroll(1500)

    store.primeLink({ name: 'lattice', query: { series: 'realized-flame' } }, { button: 0, ctrlKey: true })
    expect(store.scope).toBeNull()

    store.primeLink({ name: 'reader', params: { id: 'x' } }, { button: 0 })
    store.primeLink({ name: 'lattice' }, { button: 0 })
    expect([store.scope, store.progress]).toEqual([null, 'complete'])

    store.primeLink({ name: 'lattice', query: { series: 'realized-flame' } }, { button: 0 })
    expect([store.scope, store.progress, store.scrollTop]).toEqual([series('realized-flame'), 'all', 0])

    store.primeLink('/lattice?collection=papers', { button: 0 })
    expect(store.scope).toEqual(collection('papers'))
  })
})

describe('lattice state helpers', () => {
  it('resolveArrival', () => {
    const memory = { scope: series('a'), progress: 'unread', scrollTop: 300 }
    expect(resolveArrival(null, memory)).toBe(memory)
    expect(resolveArrival(series('a'), memory)).toBe(memory)
    expect(resolveArrival(series('none'), memory)).toEqual({ scope: series('none'), progress: 'all', scrollTop: 0 })
    expect(resolveArrival(collection('a'), memory)).toEqual({ scope: collection('a'), progress: 'all', scrollTop: 0 })
    expect(resolveArrival(series('b'), { scope: null, progress: 'complete', scrollTop: 50 }))
      .toEqual({ scope: series('b'), progress: 'all', scrollTop: 0 })
  })

  it('scopeFromQuery and queryFromScope round-trip', () => {
    for (const scope of [null, series('a'), series('none'), collection('papers')]) {
      expect(scopeFromQuery(queryFromScope(scope))).toEqual(scope)
    }
    expect(scopeFromQuery({ series: 'a', collection: 'b' })).toEqual(series('a'))
    expect(scopeFromQuery({ series: '' })).toBeNull()
    expect(scopeFromQuery({ series: ['a', 'b'] })).toBeNull()
    expect(scopeFromQuery({ series: 'not-a-real-series' })).toEqual(series('not-a-real-series'))
  })

  it('sameScope', () => {
    expect(sameScope(null, null)).toBe(true)
    expect(sameScope(series('a'), { kind: 'series', id: 'a' })).toBe(true)
    expect(sameScope(series('a'), collection('a'))).toBe(false)
    expect(sameScope(series('a'), null)).toBe(false)
  })

  it('filterChangeScrollTarget docks only when the bar is docked', () => {
    expect(filterChangeScrollTarget({ scrollTop: 0, dockTop: 555 })).toBeNull()
    expect(filterChangeScrollTarget({ scrollTop: 300, dockTop: 555 })).toBeNull()
    expect(filterChangeScrollTarget({ scrollTop: 554.2, dockTop: 555 })).toBe(555)
    expect(filterChangeScrollTarget({ scrollTop: 555, dockTop: 555 })).toBe(555)
    expect(filterChangeScrollTarget({ scrollTop: 4000, dockTop: 555 })).toBe(555)
  })
})
