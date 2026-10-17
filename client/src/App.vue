<script setup>
import { provide, ref, inject, computed, onBeforeMount, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useHead } from '@unhead/vue'
import { Analytics } from '@vercel/analytics/vue'
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
import SearchOverlay from './components/SearchOverlay.vue'
import { initThemeEarly } from './composables/useTheme'
import { BrowserCodex } from './lib/codex-browser.js'
import { createGlossaryFromRegistry } from './lib/glossary.js'

const route = useRoute()

useHead({
  titleTemplate: (title) => (title ? `${title} | Alignos` : 'Alignos'),
  title: computed(() => route.meta.title ?? null),
})

// Initialize theme as early as possible to prevent flash
onBeforeMount(() => {
  initThemeEarly()
})

// Search overlay state
const showSearch = ref(false)
const isLatticeLoaded = ref(false)
const latticeLoadError = ref(null)
const glossaryRevision = ref(0)

const openSearch = () => {
  showSearch.value = true
}

const closeSearch = () => {
  showSearch.value = false
}

// Inject codexRegistry and glossaryManager at setup level
const codexRegistry = inject('codexRegistry')
const glossaryManager = inject('glossaryManager')

// Provide search control and lattice state to children
provide('searchControls', { openSearch, closeSearch })
provide('isLatticeLoaded', isLatticeLoaded)
provide('latticeLoadError', latticeLoadError)
provide('glossaryRevision', glossaryRevision)

// Load full lattice in background after app mounts (client-side only)
onMounted(async () => {
  // Only run on client-side
  if (typeof window === 'undefined') return

  if (!codexRegistry) {
    console.warn('CodexRegistry not found in App.vue')
    return
  }

  try {
    console.log('🔮 Loading full lattice in background for instant search...')

    // Load full lattice (3.3 MB) asynchronously via dynamic import
    const module = await import('./generated/codex-lattice.json')
    const fullLatticeData = module.default

    // Replace the metadata-only codexes with full content codexes
    codexRegistry.codexes.clear()
    codexRegistry.loadFromData(fullLatticeData, BrowserCodex)

    // Refresh glossary manager with full content (metadata-only had no markdown)
    if (glossaryManager) {
      console.log('📖 Refreshing glossary manager with full content...')
      const newGlossaryManager = createGlossaryFromRegistry(codexRegistry)

      // Update the existing glossaryManager object in-place
      glossaryManager.terms = newGlossaryManager.terms
      glossaryManager.aliases = newGlossaryManager.aliases
      glossaryManager.highlightableTerms = newGlossaryManager.highlightableTerms
      glossaryManager.termUsage = newGlossaryManager.termUsage
      glossaryRevision.value += 1

      console.log(`✨ Glossary refreshed! ${glossaryManager.size} terms loaded`)

      // Clear HTML caches on all codexes so they re-render with glossary terms
      for (const codex of codexRegistry.codexes.values()) {
        if (codex.clearCache) {
          codex.clearCache()
        }
      }

      // Update window reference for debugging
      if (typeof window !== 'undefined') {
        window.glossaryManager = glossaryManager
      }
    }

    isLatticeLoaded.value = true
    console.log('✨ Full lattice loaded! Search now has instant previews for all results.')
  } catch (error) {
    console.error('Failed to load full lattice:', error)
    latticeLoadError.value = error.message
  }
})

// The view is keyed by path, so this runs on every path change: after the old view unmounts and
// before the new one mounts. Views that remember a position (lattice, reader) restore it on mount.
const resetScroll = () => {
  const main = document.querySelector('.main-content')
  if (main) main.scrollTop = 0
}

// Global keyboard shortcuts
const handleKeydown = (e) => {
  // Cmd/Ctrl + K or / to open search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    openSearch()
  } else if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
    e.preventDefault()
    openSearch()
  } else if (e.key === 'Escape' && showSearch.value) {
    closeSearch()
  }
}
</script>

<template>
  <Analytics
    :beforeSend="(event) => {
      // Respect user privacy preference
      if (typeof localStorage !== 'undefined' && localStorage.getItem('notrack') === 'true') {
        return null
      }
      return event
    }"
  />
  <div class="app-container" @keydown="handleKeydown" tabindex="-1">
    <AppHeader @open-search="openSearch" />

    <main class="main-content">
      <RouterView v-slot="{ Component, route: viewRoute }">
        <transition name="fade" mode="out-in" @after-leave="resetScroll">
          <component :is="Component" :key="viewRoute.path" />
        </transition>
      </RouterView>
      <AppFooter />
    </main>

    <SearchOverlay
      :show="showSearch"
      @close="closeSearch"
    />
  </div>
</template>

<style lang="scss">
// Global app styles using CSS custom properties
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--cl-bg);
  color: var(--cl-text);
  transition: background-color 0.3s ease, color 0.3s ease;
  overflow: hidden; // Prevent container scroll
}

.main-content {
  flex: 1;
  width: 100%;
  min-height: 0; // Allows flex child to shrink below content size
  overflow-y: auto;
}

// Page transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

// Global typography overrides for codex content
.codex-content {
  font-size: 1.125rem;
  line-height: 1.8;
  color: var(--cl-reader-text);

  h1, h2, h3, h4, h5, h6 {
    font-family: var(--bs-font-serif, 'Source Sans 3', Georgia, serif);
    font-size-adjust: none;
    color: var(--cl-text-heading);
    margin-top: 2rem;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  h1 {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 1.75rem;
    //border-bottom: 1px solid var(--cl-border-light);
    padding-bottom: 0.5rem;
  }

  h3 {
    font-size: 1.5rem;
    font-style: italic;
  }

  p {
    margin-bottom: 1.25rem;
  }

  blockquote {
    border-left: 3px solid var(--cl-accent);
    padding-left: 1.5rem;
    margin: 2rem 0;
    font-style: italic;
    color: var(--cl-text-muted);
  }

  strong {
    color: var(--cl-text-heading);
    font-weight: 600;
  }

  em {
    font-style: italic;
  }

  // Cover image styling
  img {
    max-width: 100%;
    height: auto;
    border-radius: var(--bs-border-radius-lg);
    margin: 1rem auto;
    display: block;
    box-shadow: var(--cl-shadow-lg);
  }

  // First image (cover) special styling
  > img:first-child {
    //max-width: min(800px, 80%);
    margin-bottom: 2rem;
  }

  hr {
    border: none;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      var(--cl-border),
      var(--cl-border),
      transparent
    );
    margin: 3rem 0;
    width:100%;
    display: block;
    opacity: 1;
  }

  // Lists
  ul, ol {
    margin-bottom: 1.25rem;
    padding-left: 1.5rem;
  }
  th{
    background-color: var(--cl-bg);
  }
  td, th{
    padding: 0.5rem;
    border:solid 1px var(--cl-border);
    border-collapse: collapse;
  }
  li {
    margin-bottom: 0.5rem;
  }

  // Glossary term highlighting
  .glossary-term {
    &.has-definition {
      border-bottom: 1.5px dotted var(--cl-primary);
      cursor: help;
      transition: all 0.2s ease;
      padding-bottom: 1px;

      &:hover {
        background-color: var(--cl-glossary-highlight);
        border-bottom-color: var(--cl-primary-hover);
      }
    }
  }

  // Reading setting: underline only the first two uses of each term, or none. Hover still shows it.
  @at-root {
    html[data-glossary='first-two'] .codex-content .glossary-term.has-definition:not([data-use='1'], [data-use='2']):not(:hover),
    html[data-glossary='off'] .codex-content .glossary-term.has-definition:not(:hover) {
      border-bottom-color: transparent;
    }
  }

  // Codex cross-reference links
  .codex-link {
    color: var(--cl-primary);
    text-decoration: none;
    font-weight: 600;
    border-bottom: 1px solid transparent;
    transition: all 0.2s ease;

    &:hover {
      color: var(--cl-primary-hover);
      border-bottom-color: var(--cl-primary-hover);
    }
  }
}

// Utility classes
.text-accent {
  color: var(--cl-accent) !important;
}

.text-primary {
  color: var(--cl-primary) !important;
}

.bg-surface {
  background-color: var(--cl-surface) !important;
}

.bg-elevated {
  background-color: var(--cl-bg-elevated) !important;
}

// Scrollbar styling
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--cl-bg);
}

::-webkit-scrollbar-thumb {
  background: var(--cl-border);
  border-radius: 4px;

  &:hover {
    background: var(--cl-text-muted);
  }
}

// Selection color
::selection {
  background: var(--cl-primary);
  color: white;
}
</style>
