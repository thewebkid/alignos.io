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
})
