<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { markdown2Html } from '../lib/markdown'
import { cdnUrl } from '../lib/cdn-config.js'
import {track} from '../lib/tracker.js';

const route = useRoute()
const router = useRouter()
const codexRegistry = inject('codexRegistry')

const PAGE_SIZE = 50
const currentPage = ref(1)

const query = computed(() => route.query.q || '')
const titleOnly = computed(() => route.query.titleOnly === 'true')

// Get all results without limit - all content is instantly available
const allResults = computed(() => {
  if (!query.value.trim() || !codexRegistry) return []

  const searchIn = titleOnly.value
    ? ['title']
    : ['title', 'keyword', 'content']

  // Search with high limit to get all results
  // All results now have instant snippets and match counts
  return codexRegistry.search(query.value, {
    limit: 1000, // High limit for full results
    searchIn,
    includeMatchCount: true
  })
})

// Paginated results
const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * PAGE_SIZE
  return allResults.value.slice(start, start + PAGE_SIZE)
})

const totalPages = computed(() => {
  return Math.ceil(allResults.value.length / PAGE_SIZE)
})

// Reset to page 1 when query or filter changes
watch([query, titleOnly], () => {
  currentPage.value = 1
})

// Toggle title-only filter
const toggleTitleOnly = () => {
  router.replace({
    query: {
      ...route.query,
      titleOnly: titleOnly.value ? undefined : 'true'
    }
  })
}

// Navigate to a codex
const navigateToCodex = (codexId) => {
  track('searchResultChosen', {
    q: query.value.trim(),
    codex: codexId,
    searchPage: true,
    titleOnly: titleOnly.value
  });

  router.push({ name: 'reader', params: { id: codexId } })
}

// Clean snippet of markdown artifacts
const cleanSnippet = (snippet) => {
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

  return snippet
}

// Get snippet with highlighting
const getHighlightedSnippet = (result) => {
  let snippet = result.snippet

  if (!snippet) {
    // Generate snippet for title/keyword matches
    const codex = result.codex
    if (codex) {
      snippet = codex.getSnippet(query.value, 150)
    }
  }

  if (!snippet) return ''

  // Clean the snippet first (before any HTML conversion)
  snippet = cleanSnippet(snippet)

  if (!snippet) return ''

  // Convert markdown to HTML
  let html = markdown2Html(snippet) || snippet

  // Remove any <img> tags that may have been generated
  html = html.replace(/<img[^>]*>/gi, '')

  // Highlight matching text
  const regex = new RegExp(`(${escapeRegex(query.value)})`, 'gi')
  return html.replace(regex, '<mark>$1</mark>')
}

const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Handle broken images
const handleImageError = (e) => {
  e.target.parentElement.style.display = 'none'
}

// Go to page
const goToPage = (page) => {
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="search-view">
    <div class="container">
      <header class="search-header">
        <h1>Search Results</h1>
        <p v-if="query" class="result-count">
          {{ allResults.length }} result{{ allResults.length !== 1 ? 's' : '' }} for "<strong>{{ query }}</strong>"
        </p>

        <!-- Filter toggle -->
        <div class="search-filters" v-if="query">
          <label class="filter-toggle">
            <input
              type="checkbox"
              :checked="titleOnly"
              @change="toggleTitleOnly"
            />
            <span>Search titles only</span>
          </label>
        </div>
      </header>

      <!-- Results list -->
      <div class="search-results" v-if="paginatedResults.length > 0">
        <button
          v-for="result in paginatedResults"
          :key="result.codex.id"
          class="result-item"
          @click="navigateToCodex(result.codex.id)"
        >
          <div class="result-cover" v-if="result.codex.coverImage">
            <img
              :src="cdnUrl.cover(result.codex.coverImage)"
              :alt="result.codex.title"
              loading="lazy"
              @error="handleImageError"
            />
          </div>
          <div class="result-content">
            <h2 class="result-title">{{ result.codex.title }}</h2>
            <div class="result-meta">
              <span
                v-if="result.matchCount && result.match === 'content'"
                class="match-count"
              >
                {{ result.matchCount }} {{ result.matchCount === 1 ? 'match' : 'matches' }}
              </span>
              <span v-else-if="result.match === 'title'" class="match-type">Title match</span>
              <span v-else-if="result.match === 'content' && getHighlightedSnippet(result)" class="match-type">Found in content</span>
              <span v-if="result.codex.series" class="series-name">
                {{ result.codex.series.name }}
              </span>
            </div>
            <div
              class="result-snippet"
              v-if="getHighlightedSnippet(result)"
              v-html="getHighlightedSnippet(result)"
            ></div>
          </div>
        </button>

        <!-- Pagination -->
        <div class="pagination" v-if="totalPages > 1">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Previous
          </button>

          <span class="page-info">
            Page {{ currentPage }} of {{ totalPages }}
          </span>

          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Next
          </button>
        </div>
      </div>

      <div class="no-results" v-else-if="query">
        <p>No codexes found matching your search.</p>
        <RouterLink to="/" class="btn btn-primary">Codex Lattice</RouterLink>
      </div>

      <div class="no-query" v-else>
        <p>Enter a search term to find codexes.</p>
        <RouterLink to="/" class="btn btn-primary">Codex Lattice</RouterLink>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.search-view {
  padding: 2rem 0 4rem;
}

.search-header {
  text-align: center;
  margin-bottom: 2rem;

  h1 {
    font-family: var(--bs-font-serif);
    color: var(--cl-text-heading);
    margin-bottom: 0.5rem;
  }

  .result-count {
    color: var(--cl-text-muted);
    margin-bottom: 1rem;

    strong {
      color: var(--cl-text);
    }
  }
}

.search-filters {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--cl-text-muted);
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: var(--bs-border-radius);
  background: var(--cl-surface);
  border: 1px solid var(--cl-border-light);
  transition: all 0.2s ease;

  &:hover {
    background: var(--cl-surface-hover);
    color: var(--cl-text);
  }

  input {
    accent-color: var(--cl-accent);
    cursor: pointer;
  }
}

.search-results {
  max-width: 800px;
  margin: 0 auto;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem;
  width: 100%;
  text-align: left;
  border: none;
  background: var(--cl-surface);
  border-radius: var(--bs-border-radius);
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    background: var(--cl-surface-hover);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
}

.result-cover {
  width: 64px;
  height: 85px;
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
}

.result-title {
  font-family: var(--bs-font-serif);
  font-size: 1.125rem;
  font-weight: 500;
  color: var(--cl-text-heading);
  margin: 0 0 0.375rem 0;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.match-count {
  color: var(--cl-accent);
  font-weight: 500;
}

.match-type {
  color: var(--cl-text-muted);
  font-style: italic;
}

.series-name {
  color: var(--cl-text-muted);

  &::before {
    content: '•';
    margin-right: 0.5rem;
  }
}

.result-snippet {
  font-size: 0.875rem;
  color: var(--cl-text-muted);
  line-height: 1.6;


  :deep(mark) {
    background: var(--cl-accent);
    color: white;
    padding: 0 0.125rem;
    border-radius: 2px;
  }

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
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid var(--cl-border-light);
}

.page-btn {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: var(--cl-text);
  background: var(--cl-surface);
  border: 1px solid var(--cl-border-light);
  border-radius: var(--bs-border-radius);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--cl-surface-hover);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.page-info {
  font-size: 0.875rem;
  color: var(--cl-text-muted);
}

.no-results,
.no-query {
  text-align: center;
  padding: 4rem 2rem;

  p {
    color: var(--cl-text-muted);
    margin-bottom: 1.5rem;
  }
}

.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  border-radius: var(--bs-border-radius);
  transition: all 0.2s ease;

  &.btn-primary {
    background: var(--cl-accent);
    color: white;

    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
