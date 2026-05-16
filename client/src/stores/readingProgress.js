import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORAGE_KEY = 'codex-reading-progress'

export const useReadingProgressStore = defineStore('readingProgress', () => {
  // Load initial state from localStorage (client-side only)
  const loadFromStorage = () => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      console.warn('Failed to load reading progress:', e)
      return {}
    }
  }

  const progress = ref(loadFromStorage())

  // Save to localStorage whenever progress changes (client-side only)
  watch(progress, (newProgress) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newProgress))
    } catch (e) {
      console.warn('Failed to save reading progress:', e)
    }
  }, { deep: true })

  // Get progress for a specific codex
  const getProgress = (codexId) => {
    return progress.value[codexId] || null
  }
  const getLastRead = (codexId) => {
    return progress.value[codexId]?.lastRead ||
      'unopened';
  }
  // Get scroll percentage for a codex
  const getScrollPercent = (codexId) => {
    return progress.value[codexId]?.scrollPercent || 0
  }

  // Check if codex is complete (>= 95% read)
  const isComplete = (codexId) => {
    return getScrollPercent(codexId) >= 95
  }

  // Check if codex has been started
  const isStarted = (codexId) => {
    return !!progress.value[codexId]
  }

  // Update progress for a codex
  const updateProgress = (codexId, scrollPercent, scrollPosition) => {
    const existing = progress.value[codexId] || {}

    // Always update the last position (for restoration to where user left off)
    // But only increase the max scroll percent (for progress tracking - never decreases)
    progress.value[codexId] = {
      ...existing,
      scrollPercent: Math.max(scrollPercent, existing.scrollPercent || 0),
      scrollPosition, // Always update to current position
      lastRead: new Date().toISOString()
    }
  }

  // Get last scroll position for restoration
  const getScrollPosition = (codexId) => {
    return progress.value[codexId]?.scrollPosition || 0
  }

  // Get all codexes sorted by last read
  const recentlyRead = computed(() => {
    return Object.entries(progress.value)
      .filter(([_, data]) => data.lastRead)
      .sort((a, b) => new Date(b[1].lastRead) - new Date(a[1].lastRead))
      .map(([id, data]) => ({ id, ...data }))
  })

  // Get reading statistics
  const stats = computed(() => {
    const entries = Object.entries(progress.value)
    const started = entries.length
    const completed = entries.filter(([_, data]) => data.scrollPercent >= 95).length
    const inProgress = started - completed

    return { started, completed, inProgress }
  })

  // Clear all progress (for testing/reset)
  const clearAll = () => {
    progress.value = {}
  }

  return {
    progress,
    getProgress,
    getScrollPercent,
    isComplete,
    isStarted,
    updateProgress,
    getScrollPosition,
    getLastRead,
    recentlyRead,
    stats,
    clearAll
  }
})
