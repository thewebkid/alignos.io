import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useReadingProgressStore } from '../../src/stores/readingProgress.js'

describe('reading progress', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('raises the percent, keeps the latest position, and completes at 95', () => {
    const store = useReadingProgressStore()

    store.updateProgress('codex-a', 40, 120)
    store.updateProgress('codex-a', 10, 30)

    expect(store.getScrollPercent('codex-a')).toBe(40)
    expect(store.getScrollPosition('codex-a')).toBe(30)
    expect(store.isComplete('codex-a')).toBe(false)

    store.updateProgress('codex-a', 95, 400)

    expect(store.getScrollPercent('codex-a')).toBe(95)
    expect(store.isComplete('codex-a')).toBe(true)
    expect(store.stats.completed).toBe(1)
  })

  it('resumes only a codex that is started and not complete', () => {
    const store = useReadingProgressStore()

    expect(store.resumePosition('never-opened')).toBe(0)

    store.updateProgress('reading', 40, 1200)
    expect(store.resumePosition('reading')).toBe(1200)

    store.updateProgress('finished', 95, 8000)
    expect(store.resumePosition('finished')).toBe(0)

    // Scrolling back after finishing doesn't lower the furthest point, so it still opens at the top
    store.updateProgress('finished', 40, 3000)
    expect(store.resumePosition('finished')).toBe(0)
  })
})
