import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { COMPLETE_AT, mergeProgress, normalizeProgress, roundFraction } from '../lib/progress.js'

export const STORAGE_KEY = 'codex-reading-progress'

export const useReadingProgressStore = defineStore('readingProgress', () => {
  // Load initial state from localStorage (client-side only)
  const loadFromStorage = () => {
    if (typeof window === 'undefined') return {}
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? normalizeProgress(JSON.parse(stored)) : {}
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

  // Furthest point reached, as a fraction
  const getFurthest = (codexId) => {
    return progress.value[codexId]?.furthest || 0
  }

  // Furthest point as a whole percent, for display and filters
  const getScrollPercent = (codexId) => {
    return Math.round(getFurthest(codexId) * 100)
  }

  const isComplete = (codexId) => {
    return getFurthest(codexId) >= COMPLETE_AT
  }

  // Check if codex has been started
  const isStarted = (codexId) => {
    return !!progress.value[codexId]
  }

  // Record the current position (a fraction); the furthest point never decreases
  const updateProgress = (codexId, fraction) => {
    const existing = progress.value[codexId]
    const position = roundFraction(fraction)
    progress.value[codexId] = {
      furthest: Math.max(position, existing?.furthest || 0),
      position,
      lastRead: new Date().toISOString()
    }
  }

  // Explicit complete — for when scroll-based tracking isn't enough (e.g. finished offline, or
  // skimming never hit 95%). Furthest becomes 1; the saved resume position is left alone.
  const markAsRead = (codexId) => {
    const existing = progress.value[codexId]
    progress.value[codexId] = {
      furthest: 1,
      position: existing?.position ?? 1,
      lastRead: new Date().toISOString()
    }
  }

  // Drop this codex from progress so it counts as unread. Callers that are still on the page
  // should pause auto-tracking for the visit, or the current scroll will re-write progress.
  const markAsUnread = (codexId) => {
    if (!progress.value[codexId]) return
    const next = { ...progress.value }
    delete next[codexId]
    progress.value = next
  }

  // Where to reopen a codex, as a fraction: the saved position while it's being read, otherwise the top
  const resumePosition = (codexId) => {
    return isStarted(codexId) && !isComplete(codexId) ? progress.value[codexId].position : 0
  }

  // Combine progress from another device or site; nothing already read is lowered
  const merge = (incoming) => {
    progress.value = mergeProgress(progress.value, incoming)
  }

  // Get all codexes sorted by last read
  const recentlyRead = computed(() => {
    return Object.entries(progress.value)
      .sort((a, b) => new Date(b[1].lastRead) - new Date(a[1].lastRead))
      .map(([id, data]) => ({ id, ...data, scrollPercent: Math.round(data.furthest * 100) }))
  })

  // Get reading statistics
  const stats = computed(() => {
    const entries = Object.values(progress.value)
    const started = entries.length
    const completed = entries.filter((data) => data.furthest >= COMPLETE_AT).length
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
    getFurthest,
    getScrollPercent,
    isComplete,
    isStarted,
    updateProgress,
    markAsRead,
    markAsUnread,
    resumePosition,
    merge,
    getLastRead,
    recentlyRead,
    stats,
    clearAll
  }
})
