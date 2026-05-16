<script setup>
import { ref, computed, watch, inject, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { markdown2Html } from '../lib/markdown.js'
import { cdnUrl } from '../lib/cdn-config.js'
import {track} from '../lib/tracker.js';

const props = defineProps({
  show: Boolean
})

const emit = defineEmits(['close'])

const router = useRouter()
const codexRegistry = inject('codexRegistry')
const isLatticeLoaded = inject('isLatticeLoaded')
const latticeLoadError = inject('latticeLoadError')

const searchInput = ref(null)
const query = ref('')
const results = ref([])
const selectedIndex = ref(0)
const titleOnly = ref(false)
const totalResultCount = ref(0)

// Track mousedown target to prevent drag-select from closing modal
const mouseDownTarget = ref(null)

// Focus input when overlay opens
watch(() => props.show, async (newShow) => {
  if (newShow) {
    await nextTick()
    searchInput.value?.focus()
    query.value = ''
    results.value = []
    selectedIndex.value = 0
    totalResultCount.value = 0
    // Keep titleOnly state across sessions for convenience
  }
})


// Perform search with current settings
const performSearch = () => {
  const q = query.value.trim()
  if (!q) {
    results.value = []
    totalResultCount.value = 0
    return
  }

  if (codexRegistry) {
    const searchIn = titleOnly.value
      ? ['title']
      : ['title', 'keyword', 'content']

    // Search with higher limit to show more results in overlay
    // All results now have instant snippets since full lattice is loaded
    const searchResults = codexRegistry.search(q, {
      limit: 50,
      searchIn,
      includeMatchCount: true
    })

    results.value = searchResults.map(result => {
      // search returns { codex, score, match, snippet, matchCount }
      return {
        id: result.codex.id,
        codex: result.codex,
        score: result.score,
        match: result.match,
        snippet: result.snippet || getSnippet(result.codex, q),
        matchCount: result.matchCount
      }
    })
    selectedIndex.value = 0

    // Get total count for "see more" link
    totalResultCount.value = codexRegistry.getTotalResultCount(q, { searchIn })

  }
}

// Search as user types
watch(query, performSearch)

// Re-search when titleOnly changes
watch(titleOnly, performSearch)

// Get text snippet with match
const getSnippet = (codex, searchQuery) => {
  if (!codex) return ''
  let snippet = codex.getSnippet(searchQuery, 120)
  if (!snippet) return ''

  // Remove cover image markdown (e.g., ![alt](path) or ![](path)) - must be done first
  snippet = snippet.replace(/!\[[^\]]*\]\([^)]*\)/g, '')

  // Remove any remaining image-like patterns (broken markdown)
  snippet = snippet.replace(/!\[[^\]]*\]/g, '')

  // Remove heading markdown (# ## ### etc.) and just keep the text
  snippet = snippet.replace(/^#{1,6}\s+/gm, '')

  // Remove "(Cover Image)" text that might appear
  snippet = snippet.replace(/\(Cover Image\)/gi, '')

  // Clean up multiple spaces and trim
  snippet = snippet.replace(/\s+/g, ' ').trim()

  if (!snippet) return ''

  // Convert markdown to HTML
  let html = markdown2Html(snippet) || snippet

  // Remove any <img> tags that may have been generated
  html = html.replace(/<img[^>]*>/gi, '')

  // Highlight matching text
  const regex = new RegExp(`(${escapeRegex(searchQuery)})`, 'gi')
  return html.replace(regex, '<mark>$1</mark>')
}

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Keyboard navigation
const handleKeydown = (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value.length > 0) {
    e.preventDefault()
    selectResult(results.value[selectedIndex.value])
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

// Select a result
const selectResult = (result) => {
  if (result?.codex){
    track('searchResultChosen', {
      q: query.value.trim(),
      codex: result.codex.id,
      searchPage: false,
      titleOnly: titleOnly.value
    });
    router.push({ name: 'reader', params: { id: result.codex.id } })
    emit('close')
  }
}

// Track mousedown for distinguishing clicks from drag-select
const handleMouseDown = (e) => {
  mouseDownTarget.value = e.target
}

// Close on backdrop click (only if mousedown was also on backdrop)
const handleBackdropClick = (e) => {
  // Only close if both mousedown and mouseup happened on the backdrop
  if (e.target === e.currentTarget && mouseDownTarget.value === e.currentTarget) {
    track(titleOnly.value ? 'closeSearchTitle' : 'closeSearchAll', { q: query.value.trim() });
    emit('close')
  }
  mouseDownTarget.value = null
}

// Handle broken cover images
const handleImageError = (e) => {
  // Hide the image container when image fails to load
  e.target.parentElement.style.display = 'none'
}

// Check if there are more results than displayed
const hasMoreResults = computed(() => totalResultCount.value > results.value.length)

// Navigate to full search results page
const goToFullResults = () => {
  const params = new URLSearchParams({ q: query.value })
  if (titleOnly.value) {
    params.set('titleOnly', 'true')
  }
  router.push({ path: '/search', query: { q: query.value, ...(titleOnly.value ? { titleOnly: 'true' } : {}) } })
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="overlay">
      <div
        v-if="show"
        class="search-overlay"
        @mousedown="handleMouseDown"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <div class="search-modal">
          <!-- Search input -->
          <div class="search-input-wrapper">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref="searchInput"
              v-model="query"
              type="text"
              class="search-input"
              placeholder="Search codexes..."
              autocomplete="off"
            />
            <label class="title-only-toggle">
              <input
                type="checkbox"
                v-model="titleOnly"
              />
              <span>Titles only</span>
            </label>
            <button class="close-button" @click="emit('close')" aria-label="Close search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <!-- Results -->
          <div class="search-results" v-if="results.length > 0">
            <button
              v-for="(result, index) in results"
              :key="result.id"
              class="search-result"
              :class="{ selected: index === selectedIndex }"
              @click="selectResult(result)"
              @mouseenter="selectedIndex = index"
            >
              <div class="result-cover" v-if="result.codex?.coverImage">
                <img
                  :src="cdnUrl.cover(result.codex.coverImage)"
                  :alt="result.codex.title"
                  loading="lazy"
                  @error="handleImageError"
                />
              </div>
              <div class="result-content">
                <div class="result-title">{{ result.codex?.title }}</div>
                <div class="result-meta">
                  <span
                    v-if="result.matchCount && result.match === 'content'"
                    class="match-count"
                  >
                    {{ result.matchCount }} {{ result.matchCount === 1 ? 'match' : 'matches' }}
                  </span>
                  <span v-else-if="result.match === 'title'" class="match-type">Title match</span>
                  <span v-else-if="result.match === 'keyword'" class="match-type">Keyword match</span>
                </div>
                <div
                  class="result-snippet"
                  v-if="result.snippet"
                  v-html="result.snippet"
                ></div>
              </div>
            </button>

          </div>

          <!-- Empty state -->
          <div class="search-empty" v-else-if="query.trim()">
            <p>No codexes found for "{{ query }}"</p>
          </div>

          <!-- Loading state -->
          <div class="search-loading" v-else-if="!isLatticeLoaded && !latticeLoadError">
            <p>Loading full search index...</p>
            <p class="loading-subtext">This only happens once, then it's cached.</p>
          </div>

          <!-- Error state -->
          <div class="search-error" v-else-if="latticeLoadError">
            <p>Failed to load search index: {{ latticeLoadError }}</p>
            <button class="retry-button" @click="() => window.location.reload()">Retry</button>
          </div>

          <!-- Initial state -->
          <div class="search-initial" v-else>
            <p>Start typing to search through all codexes...</p>
            <p class="search-hint-text" v-if="!isLatticeLoaded">Full search index loading in background...</p>
          </div>

          <!-- Footer with results count -->
          <div class="search-footer" v-if="results.length > 0">
            <span class="results-count">
              Showing {{ results.length }} of {{ totalResultCount }} results
            </span>
            <button v-if="hasMoreResults" class="see-all-button" @click="goToFullResults">
              See full results
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: var(--cl-overlay);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 10vh 1rem;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.search-modal {
  width: 100%;
  max-width: 600px;
  background: var(--cl-surface);
  border-radius: var(--bs-border-radius-lg);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid var(--cl-border-light);
  gap: 0.75rem;
}

.search-icon {
  color: var(--cl-text-muted);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 1.125rem;
  color: var(--cl-text);
  outline: none;

  &::placeholder {
    color: var(--cl-text-muted);
  }
}

.search-hint {
  background: var(--cl-surface-hover);
  border: 1px solid var(--cl-border-light);
  border-radius: 4px;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  color: var(--cl-text-muted);
}

.title-only-toggle {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--cl-text-muted);
  cursor: pointer;
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    background: var(--cl-surface-hover);
    color: var(--cl-text);
  }

  input {
    accent-color: var(--cl-accent);
    cursor: pointer;
  }
}

.close-button {
  background: transparent;
  border: none;
  color: var(--cl-text-muted);
  cursor: pointer;
  padding: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--cl-surface-hover);
    color: var(--cl-text);
  }

  &:active {
    transform: scale(0.95);
  }
}

.search-results {
  max-height: 400px;
  overflow-y: auto;
}

.search-result {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.1s ease;

  &:hover,
  &.selected {
    background: var(--cl-surface-hover);
  }

  & + & {
    border-top: 1px solid var(--cl-border-light);
  }
}

.result-cover {
  width: 48px;
  height: 64px;
  border-radius: var(--bs-border-radius-sm);
  overflow: hidden;
  flex-shrink: 0;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.result-content {
  flex: 1;
  min-width: 0;

  :deep(img) {
    display: none;
  }
}

.result-title {
  font-family: var(--bs-font-serif);
  font-weight: 500;
  color: var(--cl-text-heading);
  margin-bottom: 0.125rem;
}

.result-meta {
  font-size: 0.75rem;
  margin-bottom: 0.25rem;
}

.match-count {
  color: var(--cl-accent);
  font-weight: 500;
}

.match-type {
  color: var(--cl-text-muted);
  font-style: italic;
}

.result-snippet {
  font-size: 0.875rem;
  color: var(--cl-text-muted);
  line-height: 1.5;

  :deep(img) {
    display: none !important;
  }

  // Normalize all HTML elements to consistent small text
  :deep(h1), :deep(h2), :deep(h3), :deep(h4), :deep(h5), :deep(h6) {
    font-size: 0.875rem;
    font-weight: 500;
    margin: 0;
    display: inline;
  }

  :deep(p) {
    font-size: 0.875rem;
    margin: 0;
    display: inline;
  }

  :deep(strong), :deep(b) {
    font-weight: 600;
  }

  :deep(em), :deep(i) {
    font-style: italic;
  }

  :deep(mark) {
    background: var(--cl-accent);
    color: white;
    padding: 0 0.125rem;
    border-radius: 2px;
  }
}

.search-empty,
.search-initial,
.search-loading,
.search-error {
  padding: 2rem;
  text-align: center;
  color: var(--cl-text-muted);

  p {
    margin: 0;
  }

  .loading-subtext,
  .search-hint-text {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    opacity: 0.7;
  }
}

.search-loading {
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

.search-error {
  color: var(--cl-text);

  .retry-button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background: var(--cl-accent);
    color: white;
    border: none;
    border-radius: var(--bs-border-radius);
    cursor: pointer;
    transition: opacity 0.2s ease;

    &:hover {
      opacity: 0.9;
    }
  }
}

.search-footer {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: var(--cl-surface-hover);
  border-top: 1px solid var(--cl-border-light);

  .results-count {
    font-size: 0.875rem;
    color: var(--cl-text-muted);
  }

  .see-all-button {
    background: transparent;
    border: none;
    font-size: 0.875rem;
    color: var(--cl-accent);
    font-weight: 500;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    border-radius: var(--bs-border-radius);
    transition: all 0.2s ease;

    &:hover {
      background: var(--cl-surface);
      text-decoration: underline;
    }

    &::after {
      content: ' →';
    }
  }
}

// Transition
.overlay-enter-active,
.overlay-leave-active {
  transition: opacity 0.2s ease;

  .search-modal {
    transition: transform 0.2s ease, opacity 0.2s ease;
  }
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;

  .search-modal {
    transform: scale(0.95) translateY(-10px);
    opacity: 0;
  }
}
</style>
