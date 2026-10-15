<script setup>
import { ref, computed, inject, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useHead } from '@unhead/vue'
import { useReadingProgressStore } from '../stores/readingProgress'
import { BDropdown, BDropdownItem } from 'bootstrap-vue-next'
import GlossaryPopover from '../components/GlossaryPopover.vue'
import { cdnUrl } from '../lib/cdn-config.js'
import {track} from '../lib/tracker.js';
import { markdownForExport } from '../lib/markdown-export.js'

const route = useRoute()
const router = useRouter()
const codexRegistry = inject('codexRegistry')
const glossaryManager = inject('glossaryManager')
const progressStore = useReadingProgressStore()

// Loading state
const isLoadingContent = ref(false)
const contentLoadError = ref(null)

// Current codex
const codex = computed(() => {
  if (!codexRegistry) return null
  return codexRegistry.codexes.get(route.params.id)
})

// Load content if needed
watch(codex, async (newCodex) => {
  if (newCodex && !newCodex.isContentLoaded()) {
    isLoadingContent.value = true
    contentLoadError.value = null

    try {
      await codexRegistry.ensureContentLoaded(newCodex.id)
    } catch (error) {
      console.error('Failed to load codex content:', error)
      contentLoadError.value = error.message
    } finally {
      isLoadingContent.value = false
    }
  }
}, { immediate: true })

// Rendered HTML content with glossary terms and codex cross-references
const htmlContent = computed(() => {
  if (!codex.value || !codex.value.isContentLoaded()) return ''
  // Use toHtmlWithGlossary with both glossary and registry for full processing
  if (codex.value.toHtmlWithGlossary) {
    return codex.value.toHtmlWithGlossary(glossaryManager, codexRegistry)
  }
  return codex.value.toHtml()
})

// Scroll tracking
const contentRef = ref(null)
const scrollPercent = ref(0)
const showCopied = ref(false)

useHead({
  title: computed(() => codex.value?.title ?? null),
  link: computed(() => (codex.value
    ? [{ rel: 'alternate', type: 'text/markdown', href: `/md/${codex.value.id}.md`, title: codex.value.title }]
    : [])),
})

// Get the scrollable container (main-content element from App.vue)
const getScrollContainer = () => {
  if (typeof document === 'undefined') return null
  return document.querySelector('.main-content')
}

// Scroll handler
const handleScroll = () => {
  if (!contentRef.value) return

  const container = getScrollContainer()
  if (!container) return

  const scrollTop = container.scrollTop
  const scrollHeight = container.scrollHeight - container.clientHeight

  if (scrollHeight > 0) {
    scrollPercent.value = Math.round((scrollTop / scrollHeight) * 100)

    // Throttled progress update
    if (codex.value) {
      progressStore.updateProgress(codex.value.id, scrollPercent.value, scrollTop)
    }
  }
}

// Handle clicks on codex cross-reference links (use Vue Router instead of full page nav)
const handleContentClick = (e) => {
  const link = e.target.closest('.codex-link')
  if (link) {
    e.preventDefault()
    const href = link.getAttribute('href')
    if (href && href.startsWith('/codex/')) {
      router.push(href)
    }
  }
}

// Restore scroll position on mount
onMounted(async () => {
  const container = getScrollContainer()
  if (!container) return

  if (codex.value) {
    const savedPosition = progressStore.getScrollPosition(codex.value.id)
    // Small delay to ensure content is rendered
    await nextTick()
    setTimeout(() => {
      container.scrollTo({ top: savedPosition, behavior: 'instant' })
    }, 100)

  }

  container.addEventListener('scroll', handleScroll, { passive: true })
  //handleScroll() // Initial calculation
})

onUnmounted(() => {
  const container = getScrollContainer()
  if (container) {
    container.removeEventListener('scroll', handleScroll)
  }
})

// Copy markdown to clipboard
const copyMarkdown = async () => {
  if (!codex.value || typeof navigator === 'undefined' || typeof location === 'undefined') return

  try {
    await navigator.clipboard.writeText(
      markdownForExport(codex.value, location.origin)
    )
    showCopied.value = true
    setTimeout(() => {
      showCopied.value = false
    }, 2000);
    track('copyMarkdown', {codex: codex.value.originalFileName})

  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// Get PDF download link from CDN
const getPdfLink = computed(() => (codex.value?.id ? cdnUrl.pdf(codex.value.id) : null))

const coverSrc = computed(() => {
  if (!codex.value?.coverImage) return null
  return cdnUrl.cover(codex.value.coverImage)
})

const downloadMarkdown = () => {
  if (!codex.value || typeof document === 'undefined' || typeof location === 'undefined') return
  const text = markdownForExport(codex.value, location.origin)
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${codex.value.id}.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
  track('downloadMarkdown', {codex: codex.value.originalFileName})
}

// Navigation
const goBack = () => {
  if (typeof window !== 'undefined' && window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'lattice' })
  }
}

// Series context — "{name} · Part n of N", linked to the corridor
const seriesLabel = computed(() => codex.value?.series ? codex.value.getSeriesLabel() : null)
const seriesLink = computed(() =>
  codex.value?.series?.id ? { name: 'lattice', query: { series: codex.value.series.id } } : null
)

// Editions
const laterEdition = computed(() =>
  codex.value?.laterEditionId ? codexRegistry?.get(codex.value.laterEditionId) ?? null : null
)
const earlierEditions = computed(() =>
  (codex.value?.earlierEditionIds ?? []).map(id => codexRegistry?.get(id)).filter(Boolean)
)
const alternativeVersions = computed(() =>
  (codex.value?.alternativeVersionIds ?? []).map(id => codexRegistry?.get(id)).filter(Boolean)
)
const registryLines = computed(() =>
  (codex.value?.registrySeries ?? []).map((s) => ({
    ...s,
    label: s.kind === 'preface' ? 'Preface' : 'Registry',
    to: s.seriesId && s.seriesId !== codex.value?.series?.id
      ? { name: 'lattice', query: { series: s.seriesId } }
      : null
  }))
)

// Series navigation — siblingIds is the positioned members in order, including self
const siblingIndex = computed(() => codex.value?.siblingIds?.indexOf(codex.value.id) ?? -1)

const prevCodex = computed(() => {
  const i = siblingIndex.value
  if (i <= 0) return null
  return codexRegistry?.codexes.get(codex.value.siblingIds[i - 1]) ?? null
})

const nextCodex = computed(() => {
  const i = siblingIndex.value
  if (i < 0 || i >= codex.value.siblingIds.length - 1) return null
  return codexRegistry?.codexes.get(codex.value.siblingIds[i + 1]) ?? null
})
</script>

<template>
  <div class="reader-view" ref="contentRef">
    <!-- Progress bar -->
    <div class="progress-bar-container">
      <div
        class="progress-bar-fill"
        :style="{ width: scrollPercent + '%' }"
      ></div>
    </div>

    <!-- Header -->
    <header class="reader-header">
      <div class="container">
        <div class="header-content">
          <button class="btn-back" @click="goBack" title="Back to browse">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span class="d-none d-sm-inline">Back</span>
          </button>

          <h1 class="reader-title" v-if="codex">{{ codex.title }}</h1>

          <b-dropdown
            variant="outline-secondary"
            size="sm" no-caret
            class="codex-dropdown"
            menu-class="codex-dropdown-menu"
            toggle-class="d-flex align-items-center"
          >
            <template #button-content>
              <svg v-if="!showCopied" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span class="d-none d-sm-inline ms-2">{{ showCopied ? 'Copied!' : 'Menu' }}</span>
            </template>

            <b-dropdown-item @click="copyMarkdown">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy Codex
            </b-dropdown-item>

            <b-dropdown-item
              v-if="getPdfLink"
              :href="getPdfLink"
              :download="codex.originalFileName.replace(/\.md$/, '') + '.pdf'"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download PDF
            </b-dropdown-item>

            <b-dropdown-item @click="downloadMarkdown">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Download Markdown
            </b-dropdown-item>
          </b-dropdown>
        </div>
      </div>
    </header>

    <!-- Content -->
    <article class="reader-content" v-if="codex">
      <div class="container">
        <div class="content-wrapper">
          <div v-if="laterEdition" class="edition-notice" role="note">
            This is an earlier edition.
            The later edition is
            <RouterLink :to="{ name: 'reader', params: { id: laterEdition.id } }">{{ laterEdition.title }}</RouterLink>.
          </div>

          <div v-if="seriesLabel || earlierEditions.length || alternativeVersions.length || registryLines.length" class="codex-context">
            <RouterLink v-if="seriesLink" :to="seriesLink" class="context-series">{{ seriesLabel }}</RouterLink>
            <span v-else-if="seriesLabel" class="context-series">{{ seriesLabel }}</span>
            <span v-for="e in earlierEditions" :key="e.id" class="context-edition">
              Earlier edition:
              <RouterLink :to="{ name: 'reader', params: { id: e.id } }">{{ e.title }}</RouterLink>
            </span>
            <span v-for="e in alternativeVersions" :key="e.id" class="context-edition">
              Alternative version:
              <RouterLink :to="{ name: 'reader', params: { id: e.id } }">{{ e.title }}</RouterLink>
            </span>
            <span v-for="(line, i) in registryLines" :key="`${line.kind}-${i}`" class="context-edition">
              {{ line.label }}:
              <RouterLink v-if="line.to" :to="line.to">{{ line.text }}</RouterLink>
              <template v-else>{{ line.text }}</template>
            </span>
          </div>

          <!-- Cover art — plain, uncropped image with NO overlay text:
               the title already lives in the sticky header above and the
               content H1 below. (Generated content strips the markdown's
               leading cover image, so the reader paints it explicitly.) -->
          <img
            v-if="coverSrc"
            :src="coverSrc"
            :alt="codex.title"
            class="reader-cover-image"
          />

          <!-- Loading indicator -->
          <div v-if="isLoadingContent" class="loading-content">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading content...</span>
            </div>
            <p class="mt-3 text-muted">Loading codex content...</p>
          </div>

          <!-- Error message -->
          <div v-else-if="contentLoadError" class="alert alert-danger">
            <strong>Error loading content:</strong> {{ contentLoadError }}
          </div>

          <!-- Content -->
          <div
            v-else
            class="codex-content"
            v-html="htmlContent"
            @click="handleContentClick"
          ></div>

          <!-- Series navigation -->
          <nav class="series-nav" v-if="prevCodex || nextCodex">
            <RouterLink
              v-if="prevCodex"
              :to="{ name: 'reader', params: { id: prevCodex.id } }"
              class="series-link prev"
            >
              <span class="series-label">Previous</span>
              <span class="series-title">{{ prevCodex.title }}</span>
            </RouterLink>

            <RouterLink
              v-if="nextCodex"
              :to="{ name: 'reader', params: { id: nextCodex.id } }"
              class="series-link next"
            >
              <span class="series-label">Next</span>
              <span class="series-title">{{ nextCodex.title }}</span>
            </RouterLink>
          </nav>

          <!-- Back to browse -->
          <div class="end-actions">
            <RouterLink :to="{ name: 'lattice' }" class="btn-browse">
              Return to Codex Lattice
            </RouterLink>
          </div>
        </div>
      </div>
    </article>

    <!-- Not found -->
    <div v-else class="not-found">
      <div class="container text-center py-5">
        <h2>Codex not found</h2>
        <p>The codex you're looking for doesn't exist.</p>
        <RouterLink :to="{ name: 'lattice' }" class="btn btn-primary">Browse Codexes</RouterLink>
      </div>
    </div>

    <!-- Glossary popover handler -->
    <GlossaryPopover v-if="codex && !isLoadingContent && !contentLoadError" />
  </div>
</template>

<style lang="scss" scoped>
.reader-view {
  background: var(--cl-reader-bg);
}

.progress-bar-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--cl-progress-track);
  z-index: 1100;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--cl-primary), var(--cl-accent));
  transition: width 0.1s ease-out;
}

// Cover — plain image, no overlay chrome; same in-flow treatment as the old
// reader's content images (rounded corners, soft shadow, centered).
.reader-cover-image {
  display: block;
  width: 100%;
  height: auto; // natural aspect — never cropped
  margin-bottom: 2rem;
  border-radius: var(--bs-border-radius-lg);
  background: var(--cl-surface-hover);
  box-shadow: 0 8px 30px var(--cl-shadow-lg);
}

.reader-header {
  position: sticky;
  top: 0;
  background: var(--cl-reader-bg);
  border-bottom: 1px solid var(--cl-border-light);
  z-index: 1000;
  padding: 0.75rem 0;

  @supports (backdrop-filter: blur(10px)) {
    background: var(--cl-reader-bg-blur);
    backdrop-filter: blur(10px);
  }
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.reader-title {
  flex: 1;
  font-family: var(--bs-font-serif);
  font-size: 1rem;
  font-weight: 500;
  color: var(--cl-text-heading);
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;

  @media (min-width: 768px) {
    font-size: 1.125rem;
  }
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--cl-border-light);
  border-radius: var(--bs-border-radius);
  background: var(--cl-surface);
  color: var(--cl-text-muted);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--cl-surface-hover);
    color: var(--cl-text);
    border-color: var(--cl-border);
  }
}

.codex-dropdown {
  :deep(.btn) {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-color: var(--cl-border-light);
    background: var(--cl-surface);
    color: var(--cl-text-muted);
    font-size: 0.875rem;

    &:hover {
      background: var(--cl-surface-hover);
      color: var(--cl-text);
      border-color: var(--cl-border);
    }

    &:focus {
      box-shadow: none;
      border-color: var(--cl-border);
    }
  }
}

:deep(.codex-dropdown-menu) {
  min-width: 200px;
  border-color: var(--cl-border);
  background: var(--cl-surface);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

  @media (prefers-color-scheme: dark) {
    background: var(--cl-surface);
    border-color: var(--cl-border);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .dropdown-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    font-size: 0.875rem;
    color: var(--cl-text);

    &:hover {
      background: var(--cl-surface-hover);
    }

    svg {
      flex-shrink: 0;
      color: var(--cl-text-muted);
    }
  }
}

.reader-content {
  padding: 2rem 0 4rem;
}

.content-wrapper {
  max-width: 720px;
  margin: 0 auto;
}

// Earlier-edition note — an editor's marginalium rather than a boxed callout:
// no surface slab, just a gold hairline (the tone-marker motif) and quiet
// italic prose above the cover.
.edition-notice {
  margin-bottom: 1.5rem;
  padding: 0.125rem 0 0.125rem 0.875rem;
  border-left: 2px solid var(--cl-accent);
  color: var(--cl-text-muted);
  font-size: 0.9375rem;
  font-style: italic;

  a {
    color: var(--cl-primary);
    font-family: var(--bs-font-serif);
  }
}

.codex-context {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.25rem 1.25rem;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  color: var(--cl-text-muted);
  text-align: center;

  a {
    color: var(--cl-primary);
  }
}

.context-series {
  letter-spacing: 0.04em;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.context-edition {
  font-style: italic;
}

.series-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--cl-border-light);
}

.series-link {
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background: var(--cl-surface);
  border-radius: var(--bs-border-radius-lg);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background: var(--cl-surface-hover);
    transform: translateY(-2px);
  }

  &.next {
    text-align: right;
    grid-column: 2;
  }

  &.prev {
    grid-column: 1;
  }
}

.series-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--cl-text-muted);
  margin-bottom: 0.25rem;
}

.series-title {
  font-family: var(--bs-font-serif);
  font-size: 1rem;
  color: var(--cl-primary);
  font-weight: 500;
}

.end-actions {
  text-align: center;
  margin-top: 3rem;
}

.btn-browse {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1.5rem;
  background: var(--cl-primary);
  color: white;
  border-radius: var(--bs-border-radius);
  text-decoration: none;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: var(--cl-primary-hover);
    color: white;
  }
}

.not-found {
  padding: 4rem 0;

  h2 {
    color: var(--cl-text-heading);
    margin-bottom: 1rem;
  }

  p {
    color: var(--cl-text-muted);
  }
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;

  p {
    color: var(--cl-text-muted);
    margin: 0;
  }
}
</style>
