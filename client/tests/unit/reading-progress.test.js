import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useReadingProgressStore, STORAGE_KEY } from '../../src/stores/readingProgress.js'
import { mergeProgress, normalizeEntry, normalizeProgress } from '../../src/lib/progress.js'

const fakeStorage = (initial = {}) => {
  const data = new Map(Object.entries(initial))
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => data.set(k, v)
  }
}

const MON = '2026-10-12T10:00:00.000Z'
const TUE = '2026-10-13T10:00:00.000Z'
const WED = '2026-10-14T10:00:00.000Z'

describe('reading progress store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('raises the furthest point, keeps the latest position, and completes at 0.95', () => {
    const store = useReadingProgressStore()

    store.updateProgress('codex-a', 0.4)
    store.updateProgress('codex-a', 0.1)

    expect(store.getFurthest('codex-a')).toBe(0.4)
    expect(store.getScrollPercent('codex-a')).toBe(40)
    expect(store.getProgress('codex-a').position).toBe(0.1)
    expect(store.isComplete('codex-a')).toBe(false)

    store.updateProgress('codex-a', 0.95)

    expect(store.getScrollPercent('codex-a')).toBe(95)
    expect(store.isComplete('codex-a')).toBe(true)
    expect(store.stats.completed).toBe(1)
  })

  it('rounds fractions to four places', () => {
    const store = useReadingProgressStore()
    store.updateProgress('codex-a', 0.123456789)
    expect(store.getProgress('codex-a')).toMatchObject({ furthest: 0.1235, position: 0.1235 })
  })

  it('resumes only a codex that is started and not complete, as a fraction', () => {
    const store = useReadingProgressStore()

    expect(store.resumePosition('never-opened')).toBe(0)

    store.updateProgress('reading', 0.4)
    expect(store.resumePosition('reading')).toBe(0.4)

    store.updateProgress('finished', 0.95)
    expect(store.resumePosition('finished')).toBe(0)

    // Scrolling back after finishing doesn't lower the furthest point, so it still opens at the top
    store.updateProgress('finished', 0.4)
    expect(store.resumePosition('finished')).toBe(0)
  })

  it('loads earlier-shape entries and drops malformed ones', () => {
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', fakeStorage({
      [STORAGE_KEY]: JSON.stringify({
        old: { scrollPercent: 62, scrollPosition: 14000, lastRead: TUE },
        bad: { scrollPercent: 'lots', lastRead: TUE },
        current: { furthest: 0.5, position: 0.25, lastRead: WED }
      })
    }))
    const store = useReadingProgressStore()

    expect(store.getProgress('old')).toEqual({ furthest: 0.62, position: 0.62, lastRead: TUE })
    expect(store.getProgress('bad')).toBeNull()
    expect(store.getProgress('current')).toEqual({ furthest: 0.5, position: 0.25, lastRead: WED })
    expect(store.recentlyRead.map((p) => [p.id, p.scrollPercent])).toEqual([['current', 50], ['old', 62]])
  })

  it('saves the fraction shape', async () => {
    vi.stubGlobal('window', {})
    const storage = fakeStorage()
    vi.stubGlobal('localStorage', storage)
    const store = useReadingProgressStore()

    store.updateProgress('codex-a', 0.3)
    await nextTick()

    const saved = JSON.parse(storage.data.get(STORAGE_KEY))
    expect(Object.keys(saved['codex-a']).sort()).toEqual(['furthest', 'lastRead', 'position'])
  })

  it('merges incoming progress without lowering anything', () => {
    const store = useReadingProgressStore()
    store.progress = { a: { furthest: 0.3, position: 0.3, lastRead: MON } }

    store.merge({ a: { furthest: 0.8, position: 0.5, lastRead: TUE }, b: { furthest: 1, position: 1, lastRead: MON } })

    expect(store.getProgress('a')).toEqual({ furthest: 0.8, position: 0.5, lastRead: TUE })
    expect(store.isComplete('b')).toBe(true)
  })
})

describe('normalizeEntry', () => {
  it('clamps fractions and fills a missing position from the furthest point', () => {
    expect(normalizeEntry({ furthest: 4.2, lastRead: MON })).toEqual({ furthest: 1, position: 1, lastRead: MON })
    expect(normalizeEntry({ furthest: -1, position: 0.2, lastRead: MON })).toEqual({ furthest: 0, position: 0.2, lastRead: MON })
  })

  it('rejects entries without a readable date', () => {
    expect(normalizeEntry({ furthest: 0.5, lastRead: 'yesterday' })).toBeNull()
    expect(normalizeEntry({ furthest: 0.5 })).toBeNull()
    expect(normalizeEntry(null)).toBeNull()
  })

  it('ignores a non-object progress map', () => {
    expect(normalizeProgress([1, 2])).toEqual({})
    expect(normalizeProgress('x')).toEqual({})
  })
})

describe('mergeProgress', () => {
  const local = {
    a: { furthest: 0.4, position: 0.4, lastRead: WED },
    b: { furthest: 0.2, position: 0.2, lastRead: MON },
    only: { furthest: 0.1, position: 0.1, lastRead: MON }
  }
  const incoming = {
    a: { furthest: 0.9, position: 0.9, lastRead: TUE },
    b: { furthest: 0.6, position: 0.5, lastRead: TUE },
    c: { furthest: 0.7, position: 0.7, lastRead: MON }
  }

  it('takes the furthest point, the latest read, and the more recent position', () => {
    const result = mergeProgress(local, incoming)
    expect(result.a).toEqual({ furthest: 0.9, position: 0.4, lastRead: WED })
    expect(result.b).toEqual({ furthest: 0.6, position: 0.5, lastRead: TUE })
    expect(result.c).toEqual(incoming.c)
    expect(result.only).toEqual(local.only)
  })

  it('is unchanged by applying the same progress twice', () => {
    const once = mergeProgress(local, incoming)
    expect(mergeProgress(once, incoming)).toEqual(once)
  })

  it('gives the same result in either order', () => {
    expect(mergeProgress(local, incoming)).toEqual(mergeProgress(incoming, local))
  })

  it('breaks a timestamp tie by the larger position, in either order', () => {
    const x = { a: { furthest: 0.5, position: 0.2, lastRead: TUE } }
    const y = { a: { furthest: 0.3, position: 0.3, lastRead: TUE } }
    expect(mergeProgress(x, y)).toEqual(mergeProgress(y, x))
    expect(mergeProgress(x, y).a).toEqual({ furthest: 0.5, position: 0.3, lastRead: TUE })
  })

  it('never lowers the furthest point', () => {
    const result = mergeProgress(local, incoming)
    for (const id of Object.keys(local)) {
      expect(result[id].furthest).toBeGreaterThanOrEqual(local[id].furthest)
    }
  })
})
